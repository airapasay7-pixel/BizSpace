const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const number = new Intl.NumberFormat('en-US');
const date = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export const formatCurrency = (value) => currency.format(Number(value) || 0);
export const formatNumber = (value) => number.format(Number(value) || 0);
export const formatDate = (iso) => (iso ? date.format(new Date(iso)) : '');
