const { addMonths, addWeeks, isBefore, startOfDay } = require('date-fns');

/**
 * Safely parse numbers and round to 2 decimal places to prevent float inaccuracies
 */
function round2(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

/**
 * Generates an installment payment schedule
 * @param {number} totalAmount 
 * @param {number} downPayment 
 * @param {number} installmentCount 
 * @param {Date|string} firstDueDate 
 * @param {string} frequency - 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY'
 */
function generateInstallmentSchedule(totalAmount, downPayment, installmentCount, firstDueDate, frequency = 'MONTHLY') {
  const principal = round2(Number(totalAmount) - Number(downPayment || 0));
  if (principal <= 0 || installmentCount <= 0) {
    return [];
  }

  const count = parseInt(installmentCount, 10);
  const baseInstallment = round2(principal / count);
  let accumulated = 0;
  const schedule = [];
  const initialDate = new Date(firstDueDate);
  const today = startOfDay(new Date());

  for (let i = 1; i <= count; i++) {
    let dueDate;
    if (frequency === 'WEEKLY') {
      dueDate = addWeeks(initialDate, i - 1);
    } else if (frequency === 'BIWEEKLY') {
      dueDate = addWeeks(initialDate, (i - 1) * 2);
    } else {
      // Default: monthly
      dueDate = addMonths(initialDate, i - 1);
    }

    let amount;
    if (i === count) {
      // Balance out rounding cents on last installment
      amount = round2(principal - accumulated);
    } else {
      amount = baseInstallment;
      accumulated = round2(accumulated + baseInstallment);
    }

    const isPastDue = isBefore(startOfDay(dueDate), today);

    schedule.push({
      installmentNumber: i,
      dueDate,
      amount,
      paidAmount: 0,
      remainingAmount: amount,
      status: isPastDue ? 'OVERDUE' : 'PENDING'
    });
  }

  return schedule;
}

/**
 * Determine dynamic status of an installment based on paid amount, remaining amount, and due date
 */
function determineInstallmentStatus(amount, paidAmount, dueDate) {
  const total = round2(amount);
  const paid = round2(paidAmount);
  const remaining = round2(total - paid);
  const today = startOfDay(new Date());
  const isPastDue = isBefore(startOfDay(new Date(dueDate)), today);

  if (remaining <= 0) {
    return 'PAID';
  }
  if (paid > 0) {
    return isPastDue ? 'OVERDUE' : 'PARTIAL';
  }
  return isPastDue ? 'OVERDUE' : 'PENDING';
}

/**
 * Calculate days overdue
 */
function getDaysOverdue(dueDate) {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  if (!isBefore(due, today)) {
    return 0;
  }
  const diffTime = Math.abs(today - due);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

module.exports = {
  round2,
  generateInstallmentSchedule,
  determineInstallmentStatus,
  getDaysOverdue
};
