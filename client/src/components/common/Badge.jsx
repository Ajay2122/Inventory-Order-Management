const colorMap = {
  green:  'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red:    'bg-red-100 text-red-800',
  blue:   'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  gray:   'bg-gray-100 text-gray-800',
  orange: 'bg-orange-100 text-orange-800',
  cyan:   'bg-cyan-100 text-cyan-800',
  slate:  'bg-slate-100 text-slate-800',
};

const Badge = ({ label, color = 'gray', className = '' }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[color] || colorMap.gray} ${className}`}>
      {label}
    </span>
  );
};

export default Badge;
