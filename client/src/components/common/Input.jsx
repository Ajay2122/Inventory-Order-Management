import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  required,
  className = '',
  labelClassName = '',
  ...props
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className={`block text-sm font-medium ${labelClassName || 'text-gray-700'}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 disabled:cursor-not-allowed ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-white placeholder-gray-400'
            : `border-gray-300 bg-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500`
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
