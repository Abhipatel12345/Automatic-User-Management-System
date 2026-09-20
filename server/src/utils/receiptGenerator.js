/**
 * Generates formatted, unique customer codes and receipt numbers
 */

function generateCustomerCode(count) {
  const padded = String(count + 1).padStart(6, '0');
  return `CUST-${padded}`;
}

function generateReceiptNumber(sequence) {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const base = sequence ? String(sequence) : Date.now().toString().slice(-4);
  return `REC-${yearMonth}-${base}${randomSuffix}`;
}

module.exports = {
  generateCustomerCode,
  generateReceiptNumber
};
