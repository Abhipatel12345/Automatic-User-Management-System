const { PrismaClient } = require('@prisma/client');
const { subMonths, addMonths, subDays, format, startOfDay } = require('date-fns');
const { generateInstallmentSchedule, round2 } = require('../src/services/calculationService');

const prisma = new PrismaClient();

// Configuration
const TOTAL_CUSTOMERS = 2000;
const BATCH_SIZE = 250;

// Rich pools of Indian names
const firstNames = [
  'Rajesh', 'Amit', 'Sunil', 'Priya', 'Vikram', 'Anjali', 'Manoj', 'Sanjay',
  'Deepak', 'Kavita', 'Rahul', 'Pooja', 'Gaurav', 'Ritu', 'Naveen', 'Harish',
  'Neha', 'Mohit', 'Ashok', 'Sneha', 'Abhishek', 'Divya', 'Sachin', 'Vandana',
  'Rameshwar', 'Kunal', 'Tarun', 'Swati', 'Bhupendra', 'Alok', 'Aarav', 'Vivaan',
  'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Aditi', 'Ananya', 'Diya', 'Saanvi',
  'Sara', 'Anvi', 'Pari', 'Kiara', 'Meera', 'Riya', 'Yash', 'Rohan',
  'Varun', 'Manish', 'Suresh', 'Naresh', 'Chetan', 'Bhavna', 'Rashmi', 'Shilpa',
  'Preeti', 'Sandeep', 'Tanvi', 'Payal', 'Komal', 'Vikas', 'Karthik', 'Lakshmi',
  'Mahesh', 'Shruti', 'Nikhil', 'Devendra', 'Meenakshi', 'Harsh', 'Radhika', 'Girish'
];

const lastNames = [
  'Sharma', 'Verma', 'Jain', 'Patel', 'Singh', 'Gupta', 'Tiwari', 'Deshmukh',
  'Kumar', 'Rathore', 'Joshi', 'Agarwal', 'Dubey', 'Malviya', 'Chouhan', 'Saxena',
  'Mishra', 'Yadav', 'Kulkarni', 'Solanki', 'Pandey', 'Rawat', 'Shrivastava', 'Patidar',
  'Singhania', 'Meena', 'Sen', 'Lodhi', 'Nema', 'Reddy', 'Rao', 'Nair',
  'Iyer', 'Pillai', 'Bhat', 'Hegde', 'Patil', 'Shinde', 'Pawar', 'Gaikwad',
  'Jadhav', 'Kamble', 'More', 'Bhosle', 'Ghosh', 'Banerjee', 'Chatterjee', 'Mukherjee',
  'Dutta', 'Roy', 'Das', 'Bose', 'Ganguly', 'Bhattacharya', 'Chakraborty', 'Choudhury',
  'Bhatt', 'Mehta', 'Shah', 'Trivedi', 'Gandhi', 'Merchant', 'Somani', 'Sethi',
  'Grover', 'Kapoor', 'Chopra', 'Malhotra', 'Khanna', 'Varma', 'Mittal', 'Goel',
  'Bansal', 'Agrawal', 'Dhar', 'Menon', 'Nambiar', 'Bose', 'Biswas', 'Mukhopadhyay'
];

// Major Indian cities with states and pincodes
const locations = [
  { city: 'Mumbai', state: 'Maharashtra', pincode: '400001', area: 'Nariman Point, Marine Drive' },
  { city: 'Pune', state: 'Maharashtra', pincode: '411004', area: 'Kothrud, Shivaji Nagar' },
  { city: 'Nagpur', state: 'Maharashtra', pincode: '440001', area: 'Dharampeth, Civil Lines' },
  { city: 'Nashik', state: 'Maharashtra', pincode: '422001', area: 'College Road, Gangapur Road' },
  { city: 'Delhi', state: 'Delhi', pincode: '110001', area: 'Connaught Place, Barakhamba Road' },
  { city: 'Noida', state: 'Uttar Pradesh', pincode: '201301', area: 'Sector 62, City Center' },
  { city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', area: 'Hazratganj, Gomti Nagar' },
  { city: 'Kanpur', state: 'Uttar Pradesh', pincode: '208001', area: 'Mall Road, Civil Lines' },
  { city: 'Varanasi', state: 'Uttar Pradesh', pincode: '221001', area: 'Lanka, Sigra' },
  { city: 'Gurugram', state: 'Haryana', pincode: '122001', area: 'Cyber City, Golf Course Road' },
  { city: 'Faridabad', state: 'Haryana', pincode: '121001', area: 'NIT 5, Sector 15' },
  { city: 'Bengaluru', state: 'Karnataka', pincode: '560001', area: 'MG Road, Indiranagar' },
  { city: 'Mysuru', state: 'Karnataka', pincode: '570001', area: 'Jayalakshmipuram, Kuvempunagar' },
  { city: 'Hyderabad', state: 'Telangana', pincode: '500001', area: 'Banjara Hills, Jubilee Hills' },
  { city: 'Warangal', state: 'Telangana', pincode: '506002', area: 'Hanamkonda, Subedari' },
  { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', area: 'T. Nagar, Anna Nagar' },
  { city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641001', area: 'RS Puram, Gandhipuram' },
  { city: 'Ahmedabad', state: 'Gujarat', pincode: '380015', area: 'Satellite Road, Bodakdev' },
  { city: 'Surat', state: 'Gujarat', pincode: '395001', area: 'Ring Road, Athwa Lines' },
  { city: 'Vadodara', state: 'Gujarat', pincode: '390001', area: 'Alkapuri, Race Course' },
  { city: 'Rajkot', state: 'Gujarat', pincode: '360001', area: 'Kalawad Road, Yagnik Road' },
  { city: 'Jaipur', state: 'Rajasthan', pincode: '302001', area: 'Vaishali Nagar, C-Scheme' },
  { city: 'Jodhpur', state: 'Rajasthan', pincode: '342001', area: 'Ratanada, Shastri Nagar' },
  { city: 'Udaipur', state: 'Rajasthan', pincode: '313001', area: 'Hiran Magri, Sukhadia Circle' },
  { city: 'Kota', state: 'Rajasthan', pincode: '324001', area: 'Talwandi, Vigyan Nagar' },
  { city: 'Bhopal', state: 'Madhya Pradesh', pincode: '462001', area: 'Arera Colony, MP Nagar' },
  { city: 'Indore', state: 'Madhya Pradesh', pincode: '452001', area: 'Vijay Nagar, Palasia' },
  { city: 'Jabalpur', state: 'Madhya Pradesh', pincode: '482001', area: 'Civil Lines, Napier Town' },
  { city: 'Gwalior', state: 'Madhya Pradesh', pincode: '474001', area: 'Lashkar, City Center' },
  { city: 'Kolkata', state: 'West Bengal', pincode: '700001', area: 'Salt Lake, Park Street' },
  { city: 'Patna', state: 'Bihar', pincode: '800001', area: 'Boring Road, Kankarbagh' },
  { city: 'Chandigarh', state: 'Punjab', pincode: '160017', area: 'Sector 17, Sector 35' }
];

const notesPool = [
  'Regular retail customer with verified KYC documents.',
  'Prefers digital payment via UPI and WhatsApp invoice alerts.',
  'Referred by repeat buyer. Excellent payment record.',
  'Corporate employee purchase with standard EMI tenure.',
  'High-value electronics purchaser.',
  'Occasional delayed payments during holiday season; always clears dues.',
  'Active installment plan in good standing.',
  'Walk-in showroom buyer.'
];

const paymentMethods = ['UPI', 'Cash', 'Bank Transfer', 'Card', 'Cheque'];

async function main() {
  const isAppend = process.argv.includes('--append');
  console.log(`🚀 Starting high-performance 2K people generation (${isAppend ? 'APPEND mode' : 'FRESH mode'})...`);
  const startTime = Date.now();

  let startCodeNumber = 1;
  let receiptSeq = 100001;

  if (!isAppend) {
    console.log('🧹 Purging existing records for a clean 2,000 dataset...');
    await prisma.payment.deleteMany();
    await prisma.installment.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.product.deleteMany();
    await prisma.customer.deleteMany();
    console.log('✅ Clean database ready.');
  } else {
    const existingCount = await prisma.customer.count();
    startCodeNumber = existingCount + 1;
    receiptSeq = 200000 + existingCount;
    console.log(`ℹ️ Appending to existing ${existingCount} customers (starting at code CUST-${String(startCodeNumber).padStart(6, '0')})...`);
  }

  // 1. Seed / Ensure Products
  const productsCatalog = [
    { name: 'Split AC 1.5 Ton 5 Star', description: 'Inverter Dual AC with Copper Condenser', price: 38500 },
    { name: 'Double Door Refrigerator 260L', description: 'Frost Free Multi-Air Flow Refrigerator', price: 26500 },
    { name: 'Smart LED TV 55-inch 4K', description: 'Ultra HD Android Smart TV with Dolby Audio', price: 42000 },
    { name: 'Front Load Washing Machine 7kg', description: 'Fully Automatic Inverter Washing Machine', price: 32500 },
    { name: 'Desert Air Cooler 75L', description: 'High Air Delivery Honeycomb Pad Air Cooler', price: 14500 },
    { name: 'Water Purifier RO+UV+TDS', description: '8-stage purification with copper booster', price: 16800 },
    { name: 'Convection Microwave Oven 28L', description: 'Auto-cook menu, grill and bake oven', price: 15200 },
    { name: 'Pure Sine Wave Inverter 1100VA + Battery', description: '150Ah Tubular Battery with fast charging inverter', price: 23500 },
    { name: 'Dishwasher 14 Place Settings', description: 'Intensive wash with hygiene steam cycle', price: 36000 },
    { name: 'Robotic Vacuum Cleaner', description: 'LiDAR mapping with wet mopping capability', price: 21999 },
    { name: 'Air Fryer 4.5L Digital', description: 'Rapid air technology with 8 presets', price: 8499 },
    { name: '4K Home Theater Soundbar 300W', description: 'Wireless subwoofer with Dolby Atmos surround', price: 18900 }
  ];

  let products = await prisma.product.findMany();
  if (products.length === 0) {
    console.log('📦 Seeding product catalog...');
    for (const p of productsCatalog) {
      const created = await prisma.product.create({ data: p });
      products.push(created);
    }
    console.log(`✅ Created ${products.length} catalog products.`);
  } else {
    console.log(`✅ Using ${products.length} existing products.`);
  }

  // 2. Prepare 2,000 Customers Data
  console.log(`👥 Generating ${TOTAL_CUSTOMERS} realistic customer profiles...`);
  const now = new Date();
  const customersToCreate = [];

  for (let i = 0; i < TOTAL_CUSTOMERS; i++) {
    const codeNum = startCodeNumber + i;
    const customerCode = `CUST-${String(codeNum).padStart(6, '0')}`;
    
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const name = `${fn} ${ln}`;
    
    const loc = locations[i % locations.length];
    const streetNo = (i % 250) + 1;
    const address = `${streetNo}, ${loc.area}`;

    // Unique 10-digit Indian mobile number
    // Formats: 98xxxxxxx, 97xxxxxxx, etc.
    const mobilePrefixes = ['98260', '97550', '99260', '94250', '98290', '96500', '94500', '98220', '93010', '98100'];
    const prefix = mobilePrefixes[i % mobilePrefixes.length];
    const suffix = String(10000 + Math.floor(i * 4.3 + 123)).slice(-5);
    const mobile = `${prefix}${suffix}`;
    const altMobile = (i % 3 === 0) ? `91${mobile.slice(2)}` : null;

    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${codeNum}@example.com`;
    const photo = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
    const note = notesPool[i % notesPool.length];

    // Registration date staggered between 18 months ago and today
    const daysAgo = Math.floor((TOTAL_CUSTOMERS - i) * 0.25); // staggered registration
    const createdAt = subDays(now, daysAgo);

    customersToCreate.push({
      customerCode,
      name,
      photo,
      mobile,
      alternateMobile: altMobile,
      email,
      address,
      city: loc.city,
      state: loc.state,
      pincode: loc.pincode,
      notes: note,
      createdAt,
      updatedAt: createdAt
    });
  }

  // Insert customers in batches
  console.log('💾 Inserting customers into database in batches...');
  for (let i = 0; i < customersToCreate.length; i += BATCH_SIZE) {
    const chunk = customersToCreate.slice(i, i + BATCH_SIZE);
    await prisma.customer.createMany({ data: chunk });
    process.stdout.write(`\r  Progress: ${Math.min(i + BATCH_SIZE, customersToCreate.length)} / ${customersToCreate.length} customers inserted`);
  }
  console.log('\n✅ All customers inserted successfully!');

  // Fetch created customer records (IDs and codes)
  console.log('🔍 Fetching customer IDs for relation mapping...');
  const createdCustomers = await prisma.customer.findMany({
    select: { id: true, customerCode: true, createdAt: true, name: true },
    orderBy: { id: 'asc' }
  });

  // Filter to the ones we just added if append mode
  const targetCustomers = isAppend
    ? createdCustomers.slice(createdCustomers.length - TOTAL_CUSTOMERS)
    : createdCustomers;

  // 3. Generate Purchases, Installments, and Payments
  console.log('💳 Generating purchases, installment schedules, and payment histories...');
  const purchasesToInsert = [];
  const installmentsToInsert = [];
  const paymentsToInsert = [];

  // Distribution:
  // ~20% (index % 5 === 0): No purchase (leads)
  // ~40% (index % 5 === 1 or 2): 1 purchase
  // ~40% (index % 5 === 3 or 4): 2 purchases
  // Status breakdown:
  // - Overdue accounts: ~15%
  // - Fully paid: ~25%
  // - Active / Partial / Pending: ~60%

  let purchaseSeq = 1;
  const purchasesMeta = []; // To keep track of purchase IDs after batch insert

  for (let i = 0; i < targetCustomers.length; i++) {
    const cust = targetCustomers[i];
    
    // 20% are newly registered leads with no purchases
    if (i % 5 === 0) continue;

    const purchaseCount = (i % 3 === 0) ? 2 : 1;

    for (let pIdx = 0; pIdx < purchaseCount; pIdx++) {
      const product = products[(i + pIdx) % products.length];
      const quantity = 1;
      const totalAmount = Number(product.price);

      // Down payment 15% - 30%
      const dpRate = (i % 2 === 0) ? 0.20 : 0.25;
      const downPayment = round2(totalAmount * dpRate);
      const principal = round2(totalAmount - downPayment);

      const installmentCount = [4, 6, 8, 10, 12][(i + pIdx) % 5];
      
      // Purchase date staggered between customer registration and recently
      const purchaseDaysAgo = Math.max(15, Math.floor(((i + pIdx) % 180) + 10));
      const purchaseDate = subDays(now, purchaseDaysAgo);
      const firstDueDate = addMonths(purchaseDate, 1);

      purchasesToInsert.push({
        customerId: cust.id,
        productId: product.id,
        quantity,
        purchaseDate,
        totalAmount,
        downPayment,
        outstandingAmount: principal, // updated later
        paymentPlan: 'INSTALLMENT',
        installmentCount,
        installmentFrequency: 'MONTHLY',
        firstDueDate,
        notes: `Smart EMI purchase: ${product.name} (${installmentCount} months plan). Down payment ₹${downPayment} paid at checkout.`,
        createdAt: purchaseDate,
        updatedAt: purchaseDate
      });

      purchasesMeta.push({
        custIndex: i,
        customerId: cust.id,
        product,
        totalAmount,
        downPayment,
        principal,
        installmentCount,
        purchaseDate,
        firstDueDate,
        pIdx
      });
    }
  }

  console.log(`📦 Inserting ${purchasesToInsert.length} purchases...`);
  for (let i = 0; i < purchasesToInsert.length; i += BATCH_SIZE) {
    const chunk = purchasesToInsert.slice(i, i + BATCH_SIZE);
    await prisma.purchase.createMany({ data: chunk });
  }
  console.log('✅ Purchases inserted.');

  // Fetch created purchases with IDs
  const createdPurchases = await prisma.purchase.findMany({
    select: { id: true, customerId: true, purchaseDate: true, totalAmount: true, downPayment: true },
    orderBy: { id: 'asc' }
  });

  // Filter to newly created purchases
  const targetPurchases = isAppend
    ? createdPurchases.slice(createdPurchases.length - purchasesToInsert.length)
    : createdPurchases;

  console.log(`🗓️ Computing installment schedules and payments for ${targetPurchases.length} purchases...`);

  // Now generate installments for all purchases
  const purchaseUpdateBatches = []; // To update final outstandingAmount

  for (let k = 0; k < targetPurchases.length; k++) {
    const p = targetPurchases[k];
    const meta = purchasesMeta[k];
    if (!meta) continue;

    const schedule = generateInstallmentSchedule(
      meta.totalAmount,
      meta.downPayment,
      meta.installmentCount,
      meta.firstDueDate,
      'MONTHLY'
    );

    // Initial Down Payment record
    if (meta.downPayment > 0) {
      paymentsToInsert.push({
        receiptNumber: `REC-${format(meta.purchaseDate, 'yyyyMM')}-${String(receiptSeq++).slice(-6)}`,
        customerId: p.customerId,
        purchaseId: p.id,
        installmentId: null,
        amount: meta.downPayment,
        paymentDate: meta.purchaseDate,
        paymentMethod: paymentMethods[(meta.custIndex + k) % paymentMethods.length],
        referenceNumber: `DP-${p.id}-${String(100000 + k).slice(-5)}`,
        recordedBy: 'Admin',
        notes: 'Down payment recorded at POS'
      });
    }

    let runningOutstanding = meta.principal;
    const isOverdueProfile = (meta.custIndex % 7 === 0);   // ~14% overdue
    const isFullyPaidProfile = (meta.custIndex % 5 === 0); // ~20% fully paid
    const isPartialProfile = (meta.custIndex % 3 === 0);   // ~33% partial

    schedule.forEach((item) => {
      const isPast = new Date(item.dueDate) < now;
      let paidAmount = 0;
      let status = item.status;

      if (isFullyPaidProfile) {
        // Fully paid regardless of past/future
        paidAmount = item.amount;
        status = 'PAID';
      } else if (isPast) {
        if (isOverdueProfile) {
          // Missed installment!
          paidAmount = 0;
          status = 'OVERDUE';
        } else if (isPartialProfile) {
          paidAmount = round2(item.amount * 0.5);
          status = 'PARTIAL';
        } else {
          // Normal paying on time
          paidAmount = item.amount;
          status = 'PAID';
        }
      } else {
        // Future installment
        paidAmount = 0;
        status = 'PENDING';
      }

      const remainingAmount = round2(item.amount - paidAmount);
      if (paidAmount > 0) {
        runningOutstanding = round2(runningOutstanding - paidAmount);
      }

      installmentsToInsert.push({
        purchaseId: p.id,
        installmentNumber: item.installmentNumber,
        dueDate: item.dueDate,
        amount: item.amount,
        paidAmount,
        remainingAmount,
        status,
        createdAt: meta.purchaseDate,
        updatedAt: now
      });
    });

    purchaseUpdateBatches.push({
      id: p.id,
      outstandingAmount: Math.max(0, runningOutstanding)
    });
  }

  // Insert installments in chunks
  console.log(`📝 Inserting ${installmentsToInsert.length} installments in batches...`);
  for (let i = 0; i < installmentsToInsert.length; i += 500) {
    const chunk = installmentsToInsert.slice(i, i + 500);
    await prisma.installment.createMany({ data: chunk });
    process.stdout.write(`\r  Progress: ${Math.min(i + 500, installmentsToInsert.length)} / ${installmentsToInsert.length} installments inserted`);
  }
  console.log('\n✅ All installments inserted.');

  // Fetch created installments to attach payments accurately
  console.log('🔗 Attaching payment receipts to paid/partial installments...');
  const createdInstallments = await prisma.installment.findMany({
    where: { paidAmount: { gt: 0 } },
    select: { id: true, purchaseId: true, dueDate: true, paidAmount: true, status: true }
  });

  // Map installments back to purchases
  const purchaseCustMap = new Map();
  targetPurchases.forEach(p => purchaseCustMap.set(p.id, p.customerId));

  createdInstallments.forEach((inst, idx) => {
    const custId = purchaseCustMap.get(inst.purchaseId);
    if (custId) {
      const payDate = subDays(new Date(inst.dueDate), (idx % 4));
      paymentsToInsert.push({
        receiptNumber: `REC-${format(payDate, 'yyyyMM')}-${String(receiptSeq++).slice(-6)}`,
        customerId: custId,
        purchaseId: inst.purchaseId,
        installmentId: inst.id,
        amount: inst.paidAmount,
        paymentDate: payDate,
        paymentMethod: paymentMethods[idx % paymentMethods.length],
        referenceNumber: `EMI-${inst.id}-${String(500000 + idx).slice(-5)}`,
        recordedBy: 'Admin',
        notes: inst.status === 'PARTIAL' ? 'Partial EMI payment' : 'Monthly installment received'
      });
    }
  });

  // Insert payments in chunks
  console.log(`💰 Inserting ${paymentsToInsert.length} payments in batches...`);
  for (let i = 0; i < paymentsToInsert.length; i += 500) {
    const chunk = paymentsToInsert.slice(i, i + 500);
    await prisma.payment.createMany({ data: chunk });
    process.stdout.write(`\r  Progress: ${Math.min(i + 500, paymentsToInsert.length)} / ${paymentsToInsert.length} payments inserted`);
  }
  console.log('\n✅ All payments inserted.');

  // Update outstandingAmount on purchases
  console.log('🔄 Syncing purchase outstanding amounts...');
  // Execute updates in parallel chunks of 100
  for (let i = 0; i < purchaseUpdateBatches.length; i += 100) {
    const batch = purchaseUpdateBatches.slice(i, i + 100);
    await prisma.$transaction(
      batch.map(u => prisma.purchase.update({
        where: { id: u.id },
        data: { outstandingAmount: u.outstandingAmount }
      }))
    );
  }
  console.log('✅ Purchase outstanding amounts synchronized.');

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const finalCustCount = await prisma.customer.count();
  const finalPurchasesCount = await prisma.purchase.count();
  const finalInstallmentsCount = await prisma.installment.count();
  const finalPaymentsCount = await prisma.payment.count();

  console.log('\n🎉 ================================================');
  console.log(`✅ 2K PEOPLE SEEDING COMPLETED IN ${totalTime}s!`);
  console.log(`👥 Total Customers:     ${finalCustCount}`);
  console.log(`🛍️ Total Purchases:     ${finalPurchasesCount}`);
  console.log(`📅 Total Installments:  ${finalInstallmentsCount}`);
  console.log(`💳 Total Payments:      ${finalPaymentsCount}`);
  console.log('🎉 ================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during 2K seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
