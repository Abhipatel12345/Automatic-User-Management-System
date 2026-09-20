const prisma = require('../prisma');
const { round2, generateInstallmentSchedule } = require('../services/calculationService');
const { generateReceiptNumber } = require('../utils/receiptGenerator');

/**
 * List all purchases with pagination and customer/product details
 */
async function getPurchases(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search ? req.query.search.trim() : '';
    const customerId = req.query.customerId ? parseInt(req.query.customerId, 10) : null;
    const skip = (page - 1) * limit;

    const where = {};
    if (customerId) {
      where.customerId = customerId;
    }
    if (search) {
      where.OR = [
        { customer: { name: { contains: search } } },
        { customer: { customerCode: { contains: search } } },
        { product: { name: { contains: search } } },
        { customItemName: { contains: search } }
      ];
    }

    const totalCount = await prisma.purchase.count({ where });

    const purchases = await prisma.purchase.findMany({
      where,
      skip,
      take: limit,
      orderBy: { purchaseDate: 'desc' },
      include: {
        customer: true,
        product: true,
        installments: {
          orderBy: { installmentNumber: 'asc' }
        },
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    });

    const items = purchases.map((p) => {
      const totalAmount = Number(p.totalAmount);
      const downPayment = Number(p.downPayment);
      const outstanding = Number(p.outstandingAmount);
      const paid = round2(totalAmount - outstanding);

      const paidInstallments = p.installments.filter((i) => i.status === 'PAID').length;
      const overdueInstallments = p.installments.filter((i) => i.status === 'OVERDUE' || (Number(i.remainingAmount) > 0 && new Date(i.dueDate) < new Date())).length;

      let status = 'ACTIVE';
      if (outstanding <= 0) {
        status = 'PAID';
      } else if (overdueInstallments > 0) {
        status = 'OVERDUE';
      }

      return {
        id: p.id,
        purchaseDate: p.purchaseDate,
        customer: {
          id: p.customer.id,
          customerCode: p.customer.customerCode,
          name: p.customer.name,
          mobile: p.customer.mobile,
          photo: p.customer.photo
        },
        product: p.product ? {
          id: p.product.id,
          name: p.product.name,
          price: p.product.price ? Number(p.product.price) : null
        } : null,
        customItemName: p.customItemName || null,
        itemName: p.product ? p.product.name : (p.customItemName || 'Item'),
        quantity: p.quantity,
        totalAmount,
        downPayment,
        outstandingAmount: outstanding,
        totalPaid: paid,
        installmentCount: p.installmentCount,
        installmentFrequency: p.installmentFrequency,
        firstDueDate: p.firstDueDate,
        paidInstallments,
        overdueInstallments,
        status,
        notes: p.notes,
        createdAt: p.createdAt
      };
    });

    res.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch purchases' });
  }
}

/**
 * Get single purchase with its full installment schedule and payments
 */
async function getPurchaseById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        customer: true,
        product: true,
        installments: {
          orderBy: { installmentNumber: 'asc' }
        },
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    });

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    res.json({ success: true, data: purchase });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch purchase' });
  }
}

/**
 * Create a new purchase and automatically generate the installment payment schedule
 */
async function createPurchase(req, res) {
  try {
    const {
      customerId,
      productId,
      customItemName,
      productName, // backward-compatibility fallback if sent
      quantity = 1,
      purchaseDate = new Date(),
      totalAmount,
      downPayment = 0,
      paymentPlan = 'INSTALLMENT',
      installmentCount = 1,
      installmentFrequency = 'MONTHLY',
      firstDueDate,
      notes,
      paymentMethod = 'Cash'
    } = req.body;

    // Validations
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer selection is required' });
    }

    const hasProductId = productId && String(productId).trim() !== '';
    const hasCustomItem = (customItemName && String(customItemName).trim() !== '') || 
                          (!hasProductId && productName && String(productName).trim() !== '');

    // Mutual exclusivity and required validation
    if (!hasProductId && !hasCustomItem) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please select a product or enter a custom item name.' 
      });
    }

    if (hasProductId && hasCustomItem) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please select a product OR enter a custom item name, not both.' 
      });
    }

    const resolvedProductId = hasProductId ? parseInt(productId, 10) : null;
    const resolvedCustomItemName = hasCustomItem 
      ? (customItemName ? String(customItemName).trim() : String(productName).trim())
      : null;

    const numTotalAmount = round2(totalAmount);
    const numDownPayment = round2(downPayment);
    const numCount = parseInt(installmentCount, 10);
    const numQuantity = parseInt(quantity, 10) || 1;

    if (isNaN(numTotalAmount) || numTotalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Total amount must be greater than 0' });
    }
    if (isNaN(numDownPayment) || numDownPayment < 0) {
      return res.status(400).json({ success: false, message: 'Down payment cannot be negative' });
    }
    if (numDownPayment > numTotalAmount) {
      return res.status(400).json({ success: false, message: 'Down payment cannot exceed total purchase amount' });
    }
    if (paymentPlan === 'INSTALLMENT' && (isNaN(numCount) || numCount <= 0)) {
      return res.status(400).json({ success: false, message: 'Installment count must be at least 1' });
    }
    if (!firstDueDate) {
      return res.status(400).json({ success: false, message: 'First due date is required' });
    }

    const principal = round2(numTotalAmount - numDownPayment);

    // Run in a single atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Purchase directly with productId or customItemName (no fake or duplicate products created)
      const purchase = await tx.purchase.create({
        data: {
          customerId: parseInt(customerId, 10),
          productId: resolvedProductId,
          customItemName: resolvedCustomItemName,
          quantity: numQuantity,
          purchaseDate: new Date(purchaseDate),
          totalAmount: numTotalAmount,
          downPayment: numDownPayment,
          outstandingAmount: principal,
          paymentPlan,
          installmentCount: numCount,
          installmentFrequency,
          firstDueDate: new Date(firstDueDate),
          notes: notes ? notes.trim() : null
        }
      });

      // 2. If downPayment > 0, record initial payment
      let downPaymentReceipt = null;
      if (numDownPayment > 0) {
        const receiptCount = await tx.payment.count();
        const receiptNumber = generateReceiptNumber(1000 + receiptCount);
        downPaymentReceipt = await tx.payment.create({
          data: {
            receiptNumber,
            customerId: parseInt(customerId, 10),
            purchaseId: purchase.id,
            amount: numDownPayment,
            paymentDate: new Date(purchaseDate),
            paymentMethod: paymentMethod || 'Cash',
            referenceNumber: `DP-${purchase.id}-${Date.now().toString().slice(-4)}`,
            recordedBy: 'Admin',
            notes: 'Down payment recorded at time of sale'
          }
        });
      }

      // 3. Generate Installment Schedule if principal > 0
      const installments = [];
      if (principal > 0 && paymentPlan === 'INSTALLMENT') {
        const schedule = generateInstallmentSchedule(
          numTotalAmount,
          numDownPayment,
          numCount,
          new Date(firstDueDate),
          installmentFrequency
        );

        for (const item of schedule) {
          const inst = await tx.installment.create({
            data: {
              purchaseId: purchase.id,
              installmentNumber: item.installmentNumber,
              dueDate: item.dueDate,
              amount: item.amount,
              paidAmount: 0,
              remainingAmount: item.amount,
              status: item.status
            }
          });
          installments.push(inst);
        }
      }

      return { purchase, downPaymentReceipt, installments };
    });

    res.status(201).json({
      success: true,
      message: 'Purchase created and installment schedule generated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({ success: false, message: 'Failed to create purchase' });
  }
}

/**
 * Preview installment schedule before submitting purchase
 */
function previewSchedule(req, res) {
  try {
    const { totalAmount, downPayment = 0, installmentCount, firstDueDate, frequency = 'MONTHLY' } = req.body;
    const numTotal = round2(totalAmount);
    const numDown = round2(downPayment);
    const numCount = parseInt(installmentCount, 10);

    if (!numTotal || numTotal <= 0) {
      return res.status(400).json({ success: false, message: 'Total amount is required' });
    }
    if (!numCount || numCount <= 0) {
      return res.status(400).json({ success: false, message: 'Installment count must be greater than 0' });
    }
    if (!firstDueDate) {
      return res.status(400).json({ success: false, message: 'First due date is required' });
    }

    const schedule = generateInstallmentSchedule(numTotal, numDown, numCount, firstDueDate, frequency);
    const principal = round2(numTotal - numDown);

    res.json({
      success: true,
      data: {
        principal,
        totalAmount: numTotal,
        downPayment: numDown,
        installmentCount: numCount,
        schedule
      }
    });
  } catch (error) {
    console.error('Error previewing schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to preview schedule' });
  }
}

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  previewSchedule
};
