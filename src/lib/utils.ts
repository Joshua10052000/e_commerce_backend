function convertCentsToDollars(cents: number) {
  return Math.round(cents) / 100;
}

function convertDollarsToCents(dollar: number) {
  return dollar * 100;
}

export { convertCentsToDollars, convertDollarsToCents };
