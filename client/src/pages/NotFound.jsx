import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <p className="text-8xl font-black text-gray-100 select-none">404</p>
    <h1 className="text-xl font-semibold text-gray-800 mt-2">Page not found</h1>
    <p className="text-gray-400 text-sm mt-1.5 max-w-xs">
      This page doesn't exist or you may not have permission to view it.
    </p>
    <Link
      to="/"
      className="mt-6 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      Back to Dashboard
    </Link>
  </div>
);

export default NotFound;
