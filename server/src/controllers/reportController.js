const prisma = require('../prisma');
const { round2 } = require('../services/calculationService');
const { format } = require('date-fns');

/**
 * Helper to convert array of objects to CSV string
 */
function toCSV(rows, headers) {
  if (!rows || !rows.length) return headers.join(',') + '\n';
  const headerRow = headers.map((h) => `"${h}"`).join(',');
  const dataRows = rows.map((r) =>
    headers.map((h) => {
      const val = r[h] !== undefined && r[h] !== null ? String(r[h]).replace(/"/g, '""') : '';
      return `"${val}"`;
    }).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Sales Report
 */
async function getSalesReport(req, res) {
  try {
    const { startDate, endDate, productId, customerId, format: outFormat } = req.query;

    const where = {};
    if (productId) where.productId = parseInt(productId, 10);
    if (customerId) where.customerId = parseInt(customerId, 10);
    if (startDate || endDate) {
      where.purchaseDate = {};
      if (startDate) where.purchaseDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.purchaseDate.lte = end;
      }
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: { customer: true, product: true },
      orderBy: { purchaseDate: 'desc' }
    });

    let totalSales = 0;
    let totalDownPayment = 0;
    let totalOutstanding = 0;

    const rows = purchases.map((p) => {
      const amount = Number(p.totalAmount);
      const dp = Number(p.downPayment);
      const out = Number(p.outstandingAmount);
      totalSales = round2(totalSales + amount);
      totalDownPayment = round2(totalDownPayment + dp);
      totalOutstanding = round2(totalOutstanding + out);

      return {
        'Purchase ID': p.id,
        'Date': format(new Date(p.purchaseDate), 'yyyy-MM-dd'),
        'Customer Code': p.customer.customerCode,
        'Customer Name': p.customer.name,
        'Mobile': p.customer.mobile,
        'Product': p.product ? p.product.name : (p.customItemName || 'Item'),
        'Quantity': p.quantity,
        'Total Amount (₹)': amount,
        'Down Payment (₹)': dp,
        'Outstanding (₹)': out,
        'Installment Count': p.installmentCount
      };
    });

    if (outFormat === 'csv') {
      const headers = [
        'Purchase ID', 'Date', 'Customer Code', 'Customer Name', 'Mobile',
        'Product', 'Quantity', 'Total Amount (₹)', 'Down Payment (₹)', 'Outstanding (₹)', 'Installment Count'
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sales-report.csv"');
      return res.send(toCSV(rows, headers));
    }

    res.json({
      success: true,
      summary: {
        totalPurchases: purchases.length,
        totalSales,
        totalDownPayment,
        totalOutstanding
      },
      data: rows
    });
  } catch (error) {
    console.error('Error fetching sales report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate sales report' });
  }
}

/**
 * Collection Report
 */
async function getCollectionReport(req, res) {
  try {
    const { startDate, endDate, paymentMethod, format: outFormat } = req.query;

    const where = {};
    if (paymentMethod && paymentMethod !== 'ALL') where.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.paymentDate.lte = end;
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: { customer: true, purchase: { include: { product: true } } },
      orderBy: { paymentDate: 'desc' }
    });

    let totalCollected = 0;
    const methodBreakdown = {};

    const rows = payments.map((p) => {
      const amt = Number(p.amount);
      totalCollected = round2(totalCollected + amt);
      methodBreakdown[p.paymentMethod] = round2((methodBreakdown[p.paymentMethod] || 0) + amt);

      return {
        'Receipt Number': p.receiptNumber,
        'Payment Date': format(new Date(p.paymentDate), 'yyyy-MM-dd'),
        'Customer Code': p.customer.customerCode,
        'Customer Name': p.customer.name,
        'Product': p.purchase?.product?.name || p.purchase?.customItemName || 'Down Payment / Purchase',
        'Amount (₹)': amt,
        'Method': p.paymentMethod,
        'Reference': p.referenceNumber || '',
        'Recorded By': p.recordedBy
      };
    });

    if (outFormat === 'csv') {
      const headers = ['Receipt Number', 'Payment Date', 'Customer Code', 'Customer Name', 'Product', 'Amount (₹)', 'Method', 'Reference', 'Recorded By'];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="collection-report.csv"');
      return res.send(toCSV(rows, headers));
    }

    res.json({
      success: true,
      summary: {
        totalPayments: payments.length,
        totalCollected,
        methodBreakdown
      },
      data: rows
    });
  } catch (error) {
    console.error('Error fetching collection report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate collection report' });
  }
}

/**
 * Outstanding Report
 */
async function getOutstandingReport(req, res) {
  try {
    const { format: outFormat } = req.query;
    const today = new Date();

    const purchases = await prisma.purchase.findMany({
      where: { outstandingAmount: { gt: 0 } },
      include: {
        customer: true,
        product: true,
        installments: true
      },
      orderBy: { outstandingAmount: 'desc' }
    });

    let totalOutstanding = 0;
    let totalOverdue = 0;
    let totalPending = 0;

    const rows = purchases.map((p) => {
      const out = Number(p.outstandingAmount);
      totalOutstanding = round2(totalOutstanding + out);

      let purchaseOverdue = 0;
      let purchasePending = 0;

      p.installments.forEach((inst) => {
        const rem = Number(inst.remainingAmount);
        if (rem > 0) {
          if (new Date(inst.dueDate) < today) {
            purchaseOverdue = round2(purchaseOverdue + rem);
            totalOverdue = round2(totalOverdue + rem);
          } else {
            purchasePending = round2(purchasePending + rem);
            totalPending = round2(totalPending + rem);
          }
        }
      });

      return {
        'Customer Code': p.customer.customerCode,
        'Customer Name': p.customer.name,
        'Mobile': p.customer.mobile,
        'Product': p.product ? p.product.name : (p.customItemName || 'Item'),
        'Total Amount (₹)': Number(p.totalAmount),
        'Outstanding (₹)': out,
        'Overdue Amount (₹)': purchaseOverdue,
        'Pending Amount (₹)': purchasePending,
        'Status': purchaseOverdue > 0 ? 'OVERDUE' : 'PENDING'
      };
    });

    if (outFormat === 'csv') {
      const headers = ['Customer Code', 'Customer Name', 'Mobile', 'Product', 'Total Amount (₹)', 'Outstanding (₹)', 'Overdue Amount (₹)', 'Pending Amount (₹)', 'Status'];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="outstanding-report.csv"');
      return res.send(toCSV(rows, headers));
    }

    res.json({
      success: true,
      summary: {
        totalAccounts: purchases.length,
        totalOutstanding,
        totalOverdue,
        totalPending
      },
      data: rows
    });
  } catch (error) {
    console.error('Error fetching outstanding report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate outstanding report' });
  }
}

/**
 * Customer Analysis Report
 */
async function getCustomerReport(req, res) {
  try {
    const { format: outFormat } = req.query;
    const customers = await prisma.customer.findMany({
      include: {
        purchases: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    let totalCustomers = customers.length;
    let fullyPaidCount = 0;
    let withOutstandingCount = 0;

    const rows = customers.map((c) => {
      let totalPurchased = 0;
      let totalOutstanding = 0;
      let totalPaid = 0;

      c.purchases.forEach((p) => {
        totalPurchased = round2(totalPurchased + Number(p.totalAmount));
        totalOutstanding = round2(totalOutstanding + Number(p.outstandingAmount));
      });

      totalPaid = round2(totalPurchased - totalOutstanding);

      if (c.purchases.length > 0) {
        if (totalOutstanding <= 0) {
          fullyPaidCount++;
        } else {
          withOutstandingCount++;
        }
      }

      return {
        'Customer Code': c.customerCode,
        'Name': c.name,
        'Mobile': c.mobile,
        'City': c.city || '',
        'Total Purchases': c.purchases.length,
        'Total Purchased (₹)': totalPurchased,
        'Total Paid (₹)': totalPaid,
        'Outstanding (₹)': totalOutstanding,
        'Account Status': c.purchases.length === 0 ? 'NEW' : (totalOutstanding <= 0 ? 'FULLY_PAID' : 'HAS_OUTSTANDING')
      };
    });

    if (outFormat === 'csv') {
      const headers = ['Customer Code', 'Name', 'Mobile', 'City', 'Total Purchases', 'Total Purchased (₹)', 'Total Paid (₹)', 'Outstanding (₹)', 'Account Status'];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="customer-report.csv"');
      return res.send(toCSV(rows, headers));
    }

    res.json({
      success: true,
      summary: {
        totalCustomers,
        activeCustomersWithPurchases: fullyPaidCount + withOutstandingCount,
        fullyPaidCount,
        withOutstandingCount
      },
      data: rows
    });
  } catch (error) {
    console.error('Error fetching customer report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate customer report' });
  }
}

module.exports = {
  getSalesReport,
  getCollectionReport,
  getOutstandingReport,
  getCustomerReport
};
