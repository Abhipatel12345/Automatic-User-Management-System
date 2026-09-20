const prisma = require('../prisma');
const { generateCustomerCode } = require('../utils/receiptGenerator');
const { round2, getDaysOverdue } = require('../services/calculationService');

/**
 * List customers with pagination, search, status filtering, and sorting
 */
async function getCustomers(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search ? req.query.search.trim() : '';
    const statusFilter = req.query.status || ''; // 'ALL', 'FULLY_PAID', 'PENDING', 'OVERDUE'
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { customerCode: { contains: search } },
        { mobile: { contains: search } },
        { city: { contains: search } }
      ];
    }

    // High-performance status filtering at the query level for large datasets
    if (statusFilter && statusFilter !== 'ALL') {
      const now = new Date();
      if (statusFilter === 'OVERDUE') {
        const overdueInst = await prisma.installment.findMany({
          where: {
            OR: [
              { status: 'OVERDUE' },
              { remainingAmount: { gt: 0 }, dueDate: { lt: now } }
            ]
          },
          select: { purchase: { select: { customerId: true } } }
        });
        const custIds = [...new Set(overdueInst.map(i => i.purchase?.customerId).filter(Boolean))];
        where.id = { in: custIds };
      } else if (statusFilter === 'PAID') {
        const activePurchases = await prisma.purchase.findMany({
          where: { outstandingAmount: { gt: 0 } },
          select: { customerId: true }
        });
        const activeSet = new Set(activePurchases.map(p => p.customerId));
        const allPurchases = await prisma.purchase.findMany({
          select: { customerId: true }
        });
        const paidIds = [...new Set(allPurchases.map(p => p.customerId))].filter(id => !activeSet.has(id));
        where.id = { in: paidIds };
      } else if (statusFilter === 'PENDING' || statusFilter === 'PARTIAL') {
        const overdueInst = await prisma.installment.findMany({
          where: {
            OR: [
              { status: 'OVERDUE' },
              { remainingAmount: { gt: 0 }, dueDate: { lt: now } }
            ]
          },
          select: { purchase: { select: { customerId: true } } }
        });
        const overdueSet = new Set(overdueInst.map(i => i.purchase?.customerId).filter(Boolean));

        const activePurchases = await prisma.purchase.findMany({
          where: { outstandingAmount: { gt: 0 } },
          select: { customerId: true, totalAmount: true, outstandingAmount: true }
        });

        const matchingIds = [];
        const custMap = new Map();
        activePurchases.forEach(p => {
          if (!overdueSet.has(p.customerId)) {
            const current = custMap.get(p.customerId) || { total: 0, out: 0 };
            current.total += Number(p.totalAmount);
            current.out += Number(p.outstandingAmount);
            custMap.set(p.customerId, current);
          }
        });

        custMap.forEach((val, cid) => {
          const paid = round2(val.total - val.out);
          if (statusFilter === 'PARTIAL' && paid > 0) {
            matchingIds.push(cid);
          } else if (statusFilter === 'PENDING' && paid <= 0) {
            matchingIds.push(cid);
          }
        });
        where.id = { in: matchingIds };
      }
    }

    // Get total count matching search and status filter
    const totalCount = await prisma.customer.count({ where });

    // Fetch customers with their purchases and installments to calculate summary metrics
    const customers = await prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        purchases: {
          include: {
            installments: true
          }
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 1
        }
      }
    });

    // Format customer summaries
    const items = customers.map((c) => {
      let totalPurchasedAmount = 0;
      let totalDownPayment = 0;
      let totalOutstanding = 0;
      let hasOverdue = false;
      let totalPurchases = c.purchases.length;

      c.purchases.forEach((p) => {
        totalPurchasedAmount = round2(totalPurchasedAmount + Number(p.totalAmount));
        totalDownPayment = round2(totalDownPayment + Number(p.downPayment));
        totalOutstanding = round2(totalOutstanding + Number(p.outstandingAmount));

        p.installments.forEach((inst) => {
          if (inst.status === 'OVERDUE' || (Number(inst.remainingAmount) > 0 && new Date(inst.dueDate) < new Date())) {
            hasOverdue = true;
          }
        });
      });

      const totalPaid = round2(totalPurchasedAmount - totalOutstanding);
      let status = 'NO_PURCHASE';
      if (totalPurchases > 0) {
        if (totalOutstanding <= 0) {
          status = 'PAID';
        } else if (hasOverdue) {
          status = 'OVERDUE';
        } else if (totalPaid > 0) {
          status = 'PARTIAL';
        } else {
          status = 'PENDING';
        }
      }

      const lastPaymentDate = c.payments.length > 0 ? c.payments[0].paymentDate : null;

      return {
        id: c.id,
        customerCode: c.customerCode,
        name: c.name,
        photo: c.photo,
        mobile: c.mobile,
        alternateMobile: c.alternateMobile,
        email: c.email,
        city: c.city,
        state: c.state,
        pincode: c.pincode,
        totalPurchases,
        totalPurchasedAmount,
        totalPaid,
        outstanding: totalOutstanding,
        paymentStatus: status,
        lastPayment: lastPaymentDate,
        createdAt: c.createdAt
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
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
}

/**
 * Get single customer profile with financial summary, purchases, installments, payments
 */
async function getCustomerById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        purchases: {
          include: {
            product: true,
            installments: {
              orderBy: { installmentNumber: 'asc' }
            }
          },
          orderBy: { purchaseDate: 'desc' }
        },
        payments: {
          include: {
            purchase: {
              include: { product: true }
            },
            installment: true
          },
          orderBy: { paymentDate: 'desc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Compute Financial Summary
    let totalPurchaseAmount = 0;
    let totalDownPayment = 0;
    let totalOutstanding = 0;
    let overdueAmount = 0;
    const now = new Date();

    const allInstallments = [];

    customer.purchases.forEach((p) => {
      totalPurchaseAmount = round2(totalPurchaseAmount + Number(p.totalAmount));
      totalDownPayment = round2(totalDownPayment + Number(p.downPayment));
      totalOutstanding = round2(totalOutstanding + Number(p.outstandingAmount));

      p.installments.forEach((inst) => {
        const remaining = Number(inst.remainingAmount);
        const isPast = new Date(inst.dueDate) < now;
        if (remaining > 0 && isPast) {
          overdueAmount = round2(overdueAmount + remaining);
        }

        allInstallments.push({
          id: inst.id,
          purchaseId: p.id,
          productName: p.product?.name || 'Product',
          installmentNumber: inst.installmentNumber,
          dueDate: inst.dueDate,
          amount: Number(inst.amount),
          paidAmount: Number(inst.paidAmount),
          remainingAmount: remaining,
          status: inst.status,
          daysOverdue: isPast && remaining > 0 ? getDaysOverdue(inst.dueDate) : 0
        });
      });
    });

    const totalPaid = round2(totalPurchaseAmount - totalOutstanding);

    // Sort installments by due date
    allInstallments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          customerCode: customer.customerCode,
          name: customer.name,
          photo: customer.photo,
          mobile: customer.mobile,
          alternateMobile: customer.alternateMobile,
          email: customer.email,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          pincode: customer.pincode,
          notes: customer.notes,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt
        },
        financialSummary: {
          totalPurchaseAmount,
          totalDownPayment,
          totalPaid,
          totalOutstanding,
          overdueAmount
        },
        purchases: customer.purchases,
        allInstallments,
        payments: customer.payments
      }
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customer profile' });
  }
}

/**
 * Create new customer with photo upload support
 */
async function createCustomer(req, res) {
  try {
    const { name, mobile, alternateMobile, email, address, city, state, pincode, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    // Check unique mobile
    const existing = await prisma.customer.findFirst({
      where: { mobile: mobile.trim() }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A customer with this mobile number already exists' });
    }

    const count = await prisma.customer.count();
    const customerCode = generateCustomerCode(count);

    // Photo URL (uploaded file or generated avatar)
    let photo = null;
    if (req.file) {
      photo = `/uploads/${req.file.filename}`;
    } else if (req.body.photo) {
      photo = req.body.photo;
    } else {
      photo = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`;
    }

    const customer = await prisma.customer.create({
      data: {
        customerCode,
        name: name.trim(),
        photo,
        mobile: mobile.trim(),
        alternateMobile: alternateMobile ? alternateMobile.trim() : null,
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
        city: city ? city.trim() : null,
        state: state ? state.trim() : null,
        pincode: pincode ? pincode.trim() : null,
        notes: notes ? notes.trim() : null
      }
    });

    res.status(201).json({ success: true, data: customer, message: 'Customer created successfully' });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ success: false, message: 'Failed to create customer' });
  }
}

/**
 * Update customer
 */
async function updateCustomer(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, mobile, alternateMobile, email, address, city, state, pincode, notes } = req.body;

    const data = {};
    if (name) data.name = name.trim();
    if (mobile) data.mobile = mobile.trim();
    if (alternateMobile !== undefined) data.alternateMobile = alternateMobile ? alternateMobile.trim() : null;
    if (email !== undefined) data.email = email ? email.trim() : null;
    if (address !== undefined) data.address = address ? address.trim() : null;
    if (city !== undefined) data.city = city ? city.trim() : null;
    if (state !== undefined) data.state = state ? state.trim() : null;
    if (pincode !== undefined) data.pincode = pincode ? pincode.trim() : null;
    if (notes !== undefined) data.notes = notes ? notes.trim() : null;

    if (req.file) {
      data.photo = `/uploads/${req.file.filename}`;
    } else if (req.body.photo) {
      data.photo = req.body.photo;
    }

    const updated = await prisma.customer.update({
      where: { id },
      data
    });

    res.json({ success: true, data: updated, message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ success: false, message: 'Failed to update customer' });
  }
}

/**
 * Delete customer
 */
async function deleteCustomer(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.customer.delete({ where: { id } });
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ success: false, message: 'Failed to delete customer' });
  }
}

/**
 * Search customer by mobile number for Quick Assistant / Chatbot
 */
async function searchCustomerByMobile(req, res) {
  try {
    const rawMobile = req.query.mobile ? req.query.mobile.trim() : '';
    if (!rawMobile) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    const digitsOnly = rawMobile.replace(/[^0-9]/g, '');
    const last10Digits = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    const whereConditions = [
      { mobile: rawMobile },
      { alternateMobile: rawMobile }
    ];

    if (digitsOnly && digitsOnly !== rawMobile) {
      whereConditions.push({ mobile: digitsOnly });
      whereConditions.push({ alternateMobile: digitsOnly });
    }

    if (last10Digits && last10Digits.length >= 7) {
      whereConditions.push({ mobile: { contains: last10Digits } });
      whereConditions.push({ alternateMobile: { contains: last10Digits } });
    }

    // Also allow customer code or name search in assistant if user enters it
    if (rawMobile.toUpperCase().startsWith('CUST-')) {
      whereConditions.push({ customerCode: rawMobile.toUpperCase() });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        OR: whereConditions
      },
      include: {
        purchases: {
          include: {
            installments: true
          }
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 1
        }
      }
    });

    if (!customer) {
      return res.json({
        success: true,
        found: false,
        data: null,
        message: 'No customer found with this mobile number'
      });
    }

    let totalPurchasedAmount = 0;
    let totalDownPayment = 0;
    let totalOutstanding = 0;
    let activePurchasesCount = 0;

    customer.purchases.forEach((p) => {
      totalPurchasedAmount = round2(totalPurchasedAmount + Number(p.totalAmount));
      totalDownPayment = round2(totalDownPayment + Number(p.downPayment));
      totalOutstanding = round2(totalOutstanding + Number(p.outstandingAmount));
      if (Number(p.outstandingAmount) > 0) {
        activePurchasesCount += 1;
      }
    });

    const totalPaid = round2(totalPurchasedAmount - totalOutstanding);
    const lastPaymentDate = customer.payments.length > 0 ? customer.payments[0].paymentDate : null;

    res.json({
      success: true,
      found: true,
      data: {
        id: customer.id,
        customerCode: customer.customerCode,
        name: customer.name,
        photo: customer.photo,
        mobile: customer.mobile,
        alternateMobile: customer.alternateMobile,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        totalPurchases: customer.purchases.length,
        activePurchasesCount,
        totalPurchasedAmount,
        totalOutstanding,
        totalPaid,
        lastPaymentDate
      }
    });
  } catch (error) {
    console.error('Error searching customer by mobile:', error);
    res.status(500).json({ success: false, message: 'Failed to search customer by mobile' });
  }
}

module.exports = {
  getCustomers,
  getCustomerById,
  searchCustomerByMobile,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
