function addMonths(date, months) {
  const result = new Date(date);
  const day = result.getDate();
  result.setMonth(result.getMonth() + Number(months));
  if (result.getDate() < day) {
    result.setDate(0);
  }
  return result;
}

function daysFromNow(days) {
  const result = new Date();
  result.setDate(result.getDate() + Number(days));
  return result;
}

module.exports = { addMonths, daysFromNow };
