const prisma = require('../prisma');
const { round2, determineInstallmentStatus, getDaysOverdue } = require('../services/calculationService');
const { generateReceiptNumber } = require('../utils/receiptGenerator');

/**
 * List all payments with pagination, customer/method filters, and date range
 */
async function getPayments(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const customerId = req.query.customerId ? parseInt(req.query.customerId, 10) : null;
    const paymentMethod = req.query.paymentMethod || '';
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const search = req.query.search ? req.query.search.trim() : '';

    const skip = (page - 1) * limit;

    const where = {};
    if (customerId) {
      where.customerId = customerId;
    }
    if (paymentMethod && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod;
    }
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = startDate;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.paymentDate.lte = end;
      }
    }
    if (search) {
      where.OR = [
        { receiptNumber: { contains: search } },
        { referenceNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { customerCode: { contains: search } } },
        { customer: { mobile: { contains: search } } }
      ];
    }

    const totalCount = await prisma.payment.count({ where });

    const payments = await prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { paymentDate: 'desc' },
      include: {
        customer: true,
        purchase: {
          include: { product: true }
        },
        installment: true
      }
    });

    const items = payments.map((p) => ({
      id: p.id,
      receiptNumber: p.receiptNumber,
      paymentDate: p.paymentDate,
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      referenceNumber: p.referenceNumber,
      recordedBy: p.recordedBy,
      notes: p.notes,
      customer: {
        id: p.customer.id,
        customerCode: p.customer.customerCode,
        name: p.customer.name,
        mobile: p.customer.mobile
      },
      productName: p.purchase?.product?.name || p.purchase?.customItemName || 'Down Payment / Purchase',
      installmentNumber: p.installment?.installmentNumber || 'Down Payment',
      purchaseId: p.purchaseId,
      createdAt: p.createdAt
    }));

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
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
}

/**
 * Record a payment against an installment (supports partial and full payments)
 */
async function recordPayment(req, res) {
  try {
    const {
      customerId,
      purchaseId,
      installmentId,
      amount,
      paymentMethod,
      paymentDate = new Date(),
      referenceNumber,
      notes,
      recordedBy = 'Admin'
    } = req.body;

    // Validations
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer is required' });
    }
    if (!purchaseId) {
      return res.status(400).json({ success: false, message: 'Purchase selection is required' });
    }
    const payAmount = round2(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than 0' });
    }
    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: 'Payment method is required' });
    }

    // Process atomically in Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch Purchase
      const purchase = await tx.purchase.findUnique({
        where: { id: parseInt(purchaseId, 10) },
        include: { product: true }
      });
      if (!purchase) {
        throw new Error('Purchase not found');
      }

      let installment = null;
      if (installmentId) {
        installment = await tx.installment.findUnique({
          where: { id: parseInt(installmentId, 10) }
        });
        if (!installment) {
          throw new Error('Installment not found');
        }

        const remaining = round2(Number(installment.remainingAmount));
        if (payAmount > remaining) {
          throw new Error(`Payment amount (₹${payAmount}) cannot exceed remaining installment balance (₹${remaining})`);
        }

        // Update installment
        const newPaidAmount = round2(Number(installment.paidAmount) + payAmount);
        const newRemaining = round2(Number(installment.amount) - newPaidAmount);
        const newStatus = determineInstallmentStatus(installment.amount, newPaidAmount, installment.dueDate);

        await tx.installment.update({
          where: { id: installment.id },
          data: {
            paidAmount: newPaidAmount,
            remainingAmount: newRemaining,
            status: newStatus
          }
        });
      }

      // 2. Update purchase outstanding amount
      const currentOutstanding = round2(Number(purchase.outstandingAmount));
      const newPurchaseOutstanding = Math.max(0, round2(currentOutstanding - payAmount));

      await tx.purchase.update({
        where: { id: purchase.id },
        data: { outstandingAmount: newPurchaseOutstanding }
      });

      // 3. Generate receipt number and create payment record
      const paymentCount = await tx.payment.count();
      const receiptNumber = generateReceiptNumber(1000 + paymentCount);

      const payment = await tx.payment.create({
        data: {
          receiptNumber,
          customerId: parseInt(customerId, 10),
          purchaseId: parseInt(purchaseId, 10),
          installmentId: installmentId ? parseInt(installmentId, 10) : null,
          amount: payAmount,
          paymentDate: new Date(paymentDate),
          paymentMethod,
          referenceNumber: referenceNumber ? referenceNumber.trim() : null,
          notes: notes ? notes.trim() : null,
          recordedBy: recordedBy || 'Admin'
        },
        include: {
          customer: true,
          purchase: {
            include: { product: true }
          },
          installment: true
        }
      });

      return { payment, newPurchaseOutstanding };
    });

    res.status(201).json({
      success: true,
      message: 'Payment successfully recorded',
      data: result.payment
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to record payment' });
  }
}

/**
 * Get detailed receipt data for printing
 */
async function getPaymentReceipt(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        customer: true,
        purchase: {
          include: {
            product: true
          }
        },
        installment: true
      }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    res.json({
      success: true,
      data: {
        receiptNumber: payment.receiptNumber,
        businessName: 'Apex Electronics & Consumer Durables',
        businessAddress: 'Plot 104, Commercial Zone, MP Nagar, Bhopal - 462011',
        businessContact: '+91 755 422 9900 | support@apexdurables.com',
        customer: {
          name: payment.customer.name,
          customerCode: payment.customer.customerCode,
          mobile: payment.customer.mobile,
          address: payment.customer.address,
          city: payment.customer.city,
          state: payment.customer.state
        },
        product: {
          name: payment.purchase?.product?.name || payment.purchase?.customItemName || 'Product Sale',
          totalAmount: Number(payment.purchase?.totalAmount || 0),
          remainingBalance: Number(payment.purchase?.outstandingAmount || 0)
        },
        installmentInfo: payment.installment ? {
          installmentNumber: payment.installment.installmentNumber,
          dueDate: payment.installment.dueDate,
          installmentTotal: Number(payment.installment.amount),
          installmentPaid: Number(payment.installment.paidAmount),
          installmentRemaining: Number(payment.installment.remainingAmount),
          status: payment.installment.status
        } : null,
        payment: {
          id: payment.id,
          amount: Number(payment.amount),
          paymentDate: payment.paymentDate,
          paymentMethod: payment.paymentMethod,
          referenceNumber: payment.referenceNumber,
          recordedBy: payment.recordedBy,
          notes: payment.notes
        }
      }
    });
  } catch (error) {
    console.error('Error fetching payment receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment receipt' });
  }
}

/**
 * Get all upcoming/pending installments sorted by nearest due date
 */
async function getPendingPayments(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search ? req.query.search.trim() : '';
    const skip = (page - 1) * limit;

    const today = new Date();

    const where = {
      remainingAmount: { gt: 0 },
      dueDate: { gte: today }
    };

    if (search) {
      where.purchase = {
        OR: [
          { customer: { name: { contains: search } } },
          { customer: { mobile: { contains: search } } },
          { product: { name: { contains: search } } }
        ]
      };
    }

    const totalCount = await prisma.installment.count({ where });

    const installments = await prisma.installment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dueDate: 'asc' },
      include: {
        purchase: {
          include: {
            customer: true,
            product: true
          }
        }
      }
    });

    const items = installments.map((inst) => ({
      id: inst.id,
      purchaseId: inst.purchaseId,
      installmentNumber: inst.installmentNumber,
      dueDate: inst.dueDate,
      amount: Number(inst.amount),
      paidAmount: Number(inst.paidAmount),
      remainingAmount: Number(inst.remainingAmount),
      status: inst.status,
      customer: {
        id: inst.purchase.customer.id,
        customerCode: inst.purchase.customer.customerCode,
        name: inst.purchase.customer.name,
        mobile: inst.purchase.customer.mobile,
        photo: inst.purchase.customer.photo
      },
      productName: inst.purchase.product ? inst.purchase.product.name : (inst.purchase.customItemName || 'Item')
    }));

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
    console.error('Error fetching pending payments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending payments' });
  }
}

/**
 * Get all overdue payments sorted by highest priority (days overdue descending)
 */
async function getOverduePayments(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search ? req.query.search.trim() : '';
    const skip = (page - 1) * limit;

    const today = new Date();

    const where = {
      remainingAmount: { gt: 0 },
      dueDate: { lt: today }
    };

    if (search) {
      where.purchase = {
        OR: [
          { customer: { name: { contains: search } } },
          { customer: { mobile: { contains: search } } },
          { customer: { customerCode: { contains: search } } },
          { product: { name: { contains: search } } }
        ]
      };
    }

    const totalCount = await prisma.installment.count({ where });

    const installments = await prisma.installment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dueDate: 'asc' }, // oldest due date = highest days overdue
      include: {
        purchase: {
          include: {
            customer: true,
            product: true
          }
        }
      }
    });

    const items = installments.map((inst) => {
      const daysOverdue = getDaysOverdue(inst.dueDate);
      return {
        id: inst.id,
        purchaseId: inst.purchaseId,
        installmentNumber: inst.installmentNumber,
        dueDate: inst.dueDate,
        originalAmount: Number(inst.amount),
        paidAmount: Number(inst.paidAmount),
        outstandingAmount: Number(inst.remainingAmount),
        daysOverdue,
        status: 'OVERDUE',
        customer: {
          id: inst.purchase.customer.id,
          customerCode: inst.purchase.customer.customerCode,
          name: inst.purchase.customer.name,
          mobile: inst.purchase.customer.mobile,
          photo: inst.purchase.customer.photo,
          city: inst.purchase.customer.city
        },
        productName: inst.purchase.product ? inst.purchase.product.name : (inst.purchase.customItemName || 'Item')
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
    console.error('Error fetching overdue payments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch overdue payments' });
  }
}

module.exports = {
  getPayments,
  recordPayment,
  getPaymentReceipt,
  getPendingPayments,
  getOverduePayments
};
