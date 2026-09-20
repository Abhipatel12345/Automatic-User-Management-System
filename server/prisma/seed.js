const { PrismaClient } = require('@prisma/client');
const { subMonths, addMonths, subDays, format } = require('date-fns');
const { generateInstallmentSchedule, determineInstallmentStatus, round2 } = require('../src/services/calculationService');
const { generateCustomerCode, generateReceiptNumber } = require('../src/utils/receiptGenerator');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  await prisma.payment.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();

  console.log('Cleared existing records.');

  // 1. Seed Products
  const productsData = [
    { name: 'Split AC 1.5 Ton 5 Star', description: 'Inverter Dual AC with Copper Condenser', price: 38500 },
    { name: 'Double Door Refrigerator 260L', description: 'Frost Free Multi-Air Flow Refrigerator', price: 26500 },
    { name: 'Smart LED TV 55-inch 4K', description: 'Ultra HD Android Smart TV with Dolby Audio', price: 42000 },
    { name: 'Front Load Washing Machine 7kg', description: 'Fully Automatic Inverter Washing Machine', price: 32500 },
    { name: 'Desert Air Cooler 75L', description: 'High Air Delivery Honeycomb Pad Air Cooler', price: 14500 },
    { name: 'Water Purifier RO+UV+TDS', description: '8-stage purification with copper booster', price: 16800 },
    { name: 'Convection Microwave Oven 28L', description: 'Auto-cook menu, grill and bake oven', price: 15200 },
    { name: 'Pure Sine Wave Inverter 1100VA + Battery', description: '150Ah Tubular Battery with fast charging inverter', price: 23500 }
  ];

  const products = [];
  for (const p of productsData) {
    const created = await prisma.product.create({ data: p });
    products.push(created);
  }
  console.log(`Created ${products.length} products.`);

  // 2. Seed Customers
  const customerProfiles = [
    { name: 'Rajesh Sharma', mobile: '9826012345', city: 'Bhopal', state: 'Madhya Pradesh', pincode: '462001', address: '12 Arera Colony' },
    { name: 'Amit Verma', mobile: '9755023456', city: 'Indore', state: 'Madhya Pradesh', pincode: '452001', address: '45 Vijay Nagar' },
    { name: 'Sunil Jain', mobile: '9926034567', city: 'Jabalpur', state: 'Madhya Pradesh', pincode: '482001', address: '88 Civil Lines' },
    { name: 'Priya Patel', mobile: '9425045678', city: 'Ahmedabad', state: 'Gujarat', pincode: '380015', address: '202 Satellite Road' },
    { name: 'Vikram Singh', mobile: '9829056789', city: 'Jaipur', state: 'Rajasthan', pincode: '302001', address: '77 Vaishali Nagar' },
    { name: 'Anjali Gupta', mobile: '9650067890', city: 'Delhi', state: 'Delhi', pincode: '110001', address: '14 Connaught Place' },
    { name: 'Manoj Tiwari', mobile: '9450078901', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', address: '56 Hazratganj' },
    { name: 'Sanjay Deshmukh', mobile: '9822089012', city: 'Pune', state: 'Maharashtra', pincode: '411004', address: '9 Kothrud' },
    { name: 'Deepak Kumar', mobile: '9301090123', city: 'Gwalior', state: 'Madhya Pradesh', pincode: '474001', address: '34 Lashkar' },
    { name: 'Kavita Rathore', mobile: '9724011234', city: 'Surat', state: 'Gujarat', pincode: '395001', address: '10 Ring Road' },
    { name: 'Rahul Joshi', mobile: '9893022345', city: 'Ujjain', state: 'Madhya Pradesh', pincode: '456001', address: '22 Freeganj' },
    { name: 'Pooja Agarwal', mobile: '9810033456', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301', address: 'Sector 62' },
    { name: 'Gaurav Dubey', mobile: '9826044567', city: 'Bhopal', state: 'Madhya Pradesh', pincode: '462016', address: 'C-Sector Indrapuri' },
    { name: 'Ritu Malviya', mobile: '9755055678', city: 'Indore', state: 'Madhya Pradesh', pincode: '452010', address: '103 Palasia' },
    { name: 'Naveen Chouhan', mobile: '9893066789', city: 'Dewas', state: 'Madhya Pradesh', pincode: '455001', address: '18 AB Road' },
    { name: 'Harish Patel', mobile: '9425077890', city: 'Vadodara', state: 'Gujarat', pincode: '390001', address: '5 Alkapuri' },
    { name: 'Neha Saxena', mobile: '9650088901', city: 'Gurugram', state: 'Haryana', pincode: '122001', address: 'Cyber City' },
    { name: 'Mohit Mishra', mobile: '9450099012', city: 'Kanpur', state: 'Uttar Pradesh', pincode: '208001', address: '24 Mall Road' },
    { name: 'Ashok Yadav', mobile: '9829011123', city: 'Kota', state: 'Rajasthan', pincode: '324001', address: '12 Talwandi' },
    { name: 'Sneha Kulkarni', mobile: '9822022234', city: 'Nagpur', state: 'Maharashtra', pincode: '440001', address: '4 Dharampeth' },
    { name: 'Abhishek Solanki', mobile: '9724033345', city: 'Rajkot', state: 'Gujarat', pincode: '360001', address: '15 Kalawad Road' },
    { name: 'Divya Pandey', mobile: '9301044456', city: 'Sagar', state: 'Madhya Pradesh', pincode: '470001', address: '8 Cantt Road' },
    { name: 'Sachin Rawat', mobile: '9810055567', city: 'Faridabad', state: 'Haryana', pincode: '121001', address: 'NIT 5' },
    { name: 'Vandana Shrivastava', mobile: '9826066678', city: 'Bhopal', state: 'Madhya Pradesh', pincode: '462003', address: '7 MP Nagar Zone 2' },
    { name: 'Rameshwar Patidar', mobile: '9755077789', city: 'Indore', state: 'Madhya Pradesh', pincode: '452002', address: '51 Sapna Sangeeta' },
    { name: 'Kunal Singhania', mobile: '9893088890', city: 'Raipur', state: 'Chhattisgarh', pincode: '492001', address: '10 Shankar Nagar' },
    { name: 'Tarun Meena', mobile: '9829099901', city: 'Udaipur', state: 'Rajasthan', pincode: '313001', address: '3 Hiran Magri' },
    { name: 'Swati Sen', mobile: '9425012123', city: 'Satna', state: 'Madhya Pradesh', pincode: '485001', address: '19 Rewa Road' },
    { name: 'Bhupendra Lodhi', mobile: '9650023234', city: 'Rewa', state: 'Madhya Pradesh', pincode: '486001', address: '45 College Road' },
    { name: 'Alok Nema', mobile: '9450034345', city: 'Chhindwara', state: 'Madhya Pradesh', pincode: '480001', address: '12 Parasia Road' }
  ];

  const customers = [];
  for (let i = 0; i < customerProfiles.length; i++) {
    const cp = customerProfiles[i];
    const customerCode = generateCustomerCode(i);
    const photoUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cp.name)}`;
    const created = await prisma.customer.create({
      data: {
        customerCode,
        name: cp.name,
        photo: photoUrl,
        mobile: cp.mobile,
        alternateMobile: `91${cp.mobile.slice(2)}`,
        email: `${cp.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        address: cp.address,
        city: cp.city,
        state: cp.state,
        pincode: cp.pincode,
        notes: 'Regular retail customer. Verified identity documents.'
      }
    });
    customers.push(created);
  }
  console.log(`Created ${customers.length} customers.`);

  // 3. Seed Purchases, Installments, and Payments
  const paymentMethods = ['UPI', 'Cash', 'Bank Transfer', 'Card', 'Cheque'];
  let receiptSeq = 1001;

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    // Some customers have 1 purchase, some have 2
    const purchaseCount = (i % 4 === 0) ? 2 : 1;

    for (let pIdx = 0; pIdx < purchaseCount; pIdx++) {
      const product = products[(i + pIdx) % products.length];
      const quantity = 1;
      const totalAmount = Number(product.price);
      
      // Determine down payment (10% to 30%)
      const downPaymentRate = (i % 3 === 0) ? 0.25 : (i % 2 === 0 ? 0.20 : 0.15);
      const downPayment = round2(totalAmount * downPaymentRate);
      
      // Installment count: 4, 6, 8, or 10
      const installmentCount = 4 + ((i + pIdx) % 4) * 2; // 4, 6, 8, 10
      
      // Purchase date staggered between 1 to 5 months ago
      const monthsAgo = ((i + pIdx) % 5) + 1;
      const purchaseDate = subMonths(new Date(), monthsAgo);
      const firstDueDate = addMonths(purchaseDate, 1);

      // Initial schedule
      const schedule = generateInstallmentSchedule(totalAmount, downPayment, installmentCount, firstDueDate, 'MONTHLY');
      const principal = round2(totalAmount - downPayment);

      const purchase = await prisma.purchase.create({
        data: {
          customerId: customer.id,
          productId: product.id,
          quantity,
          purchaseDate,
          totalAmount,
          downPayment,
          outstandingAmount: principal, // will be updated as payments are applied
          paymentPlan: 'INSTALLMENT',
          installmentCount,
          installmentFrequency: 'MONTHLY',
          firstDueDate,
          notes: `Purchased with ${installmentCount}-month installment plan. Down payment ₹${downPayment} paid.`
        }
      });

      // Down payment payment record
      if (downPayment > 0) {
        await prisma.payment.create({
          data: {
            receiptNumber: generateReceiptNumber(receiptSeq++),
            customerId: customer.id,
            purchaseId: purchase.id,
            amount: downPayment,
            paymentDate: purchaseDate,
            paymentMethod: paymentMethods[i % paymentMethods.length],
            referenceNumber: `DP-${purchase.id}-${Date.now().toString().slice(-6)}`,
            recordedBy: 'Admin',
            notes: 'Down payment recorded at point of sale'
          }
        });
      }

      // Now create installments and apply payments depending on profile to create rich states
      let runningOutstanding = principal;

      for (let s = 0; s < schedule.length; s++) {
        const item = schedule[s];
        const isPast = new Date(item.dueDate) < new Date();
        let paidAmount = 0;
        let installmentStatus = item.status;

        if (isPast) {
          // Diverse scenarios for past installments:
          if (i % 5 === 0) {
            // Customer 0, 5, 10... has OVERDUE installments (0 paid)
            paidAmount = 0;
            installmentStatus = 'OVERDUE';
          } else if (i % 3 === 0) {
            // Customer 3, 6, 9... has PARTIAL installments
            paidAmount = round2(item.amount * 0.5);
            installmentStatus = 'PARTIAL';
          } else {
            // Most past installments are fully PAID
            paidAmount = item.amount;
            installmentStatus = 'PAID';
          }
        } else {
          // Future installment
          paidAmount = 0;
          installmentStatus = 'PENDING';
        }

        const remainingAmount = round2(item.amount - paidAmount);

        const createdInstallment = await prisma.installment.create({
          data: {
            purchaseId: purchase.id,
            installmentNumber: item.installmentNumber,
            dueDate: item.dueDate,
            amount: item.amount,
            paidAmount,
            remainingAmount,
            status: installmentStatus
          }
        });

        // If there was payment against this installment, record it
        if (paidAmount > 0) {
          runningOutstanding = round2(runningOutstanding - paidAmount);

          // Payment date a few days before or on due date, or recently
          const paymentDate = subDays(item.dueDate, (s % 3));

          await prisma.payment.create({
            data: {
              receiptNumber: generateReceiptNumber(receiptSeq++),
              customerId: customer.id,
              purchaseId: purchase.id,
              installmentId: createdInstallment.id,
              amount: paidAmount,
              paymentDate,
              paymentMethod: paymentMethods[(i + s) % paymentMethods.length],
              referenceNumber: `PAY-${createdInstallment.id}-${Date.now().toString().slice(-6)}`,
              recordedBy: 'Admin',
              notes: installmentStatus === 'PARTIAL' ? 'Partial installment payment received' : 'Full installment paid'
            }
          });
        }
      }

      // Update purchase outstanding amount
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { outstandingAmount: Math.max(0, runningOutstanding) }
      });
    }
  }

  // Create a few recent payments (today & yesterday) for the dashboard feed
  const recentCustomers = customers.slice(0, 3);
  for (let r = 0; r < recentCustomers.length; r++) {
    const rc = recentCustomers[r];
    const purchases = await prisma.purchase.findMany({ where: { customerId: rc.id } });
    if (purchases.length > 0) {
      await prisma.payment.create({
        data: {
          receiptNumber: generateReceiptNumber(receiptSeq++),
          customerId: rc.id,
          purchaseId: purchases[0].id,
          amount: 2500,
          paymentDate: r === 0 ? new Date() : subDays(new Date(), r),
          paymentMethod: 'UPI',
          referenceNumber: `UPI-REC-${Date.now().toString().slice(-6)}`,
          recordedBy: 'Admin',
          notes: 'Recent counter collection'
        }
      });
    }
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
