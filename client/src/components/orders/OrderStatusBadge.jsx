import Badge from '../common/Badge';

const statusConfig = {
  Pending:   { color: 'yellow', label: 'Pending' },
  Confirmed: { color: 'green',  label: 'Confirmed' },
  Cancelled: { color: 'red',    label: 'Cancelled' },
};

const OrderStatusBadge = ({ status }) => {
  const config = statusConfig[status] || { color: 'gray', label: status };
  return <Badge label={config.label} color={config.color} />;
};

export default OrderStatusBadge;
