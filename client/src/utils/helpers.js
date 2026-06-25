export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

export const formatDateShort = (dateString) => {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
};

export const getApiError = (error) => {
  // Use the normalized message attached by the axios interceptor first
  return (
    error?.userMessage ||
    error?.response?.data?.message ||
    error?.message ||
    'An unexpected error occurred'
  );
};

export const STATUS_COLORS = {
  Pending: 'yellow',
  Confirmed: 'green',
  Cancelled: 'red',
};

export const CATEGORY_COLORS = {
  Electronics: 'blue',
  Clothing: 'purple',
  'Food & Beverages': 'orange',
  Furniture: 'brown',
  Stationery: 'cyan',
  Tools: 'gray',
  Other: 'slate',
};
