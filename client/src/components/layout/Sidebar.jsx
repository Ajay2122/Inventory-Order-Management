import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ArchiveBoxIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';

const navItems = [
  { to: '/',         label: 'Dashboard', Icon: HomeIcon },
  { to: '/products', label: 'Products',  Icon: ArchiveBoxIcon },
  { to: '/orders',   label: 'Orders',    Icon: ClipboardDocumentListIcon },
];

const roleBadge = {
  admin:   'bg-blue-100 text-blue-700',
  manager: 'bg-green-100 text-green-700',
  viewer:  'bg-gray-100 text-gray-600',
};

const Sidebar = ({ isOpen, onClose }) => {
  const user = useSelector(selectUser);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-60 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Brand */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <span className="text-gray-900 font-bold text-base">StockFlow</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600 p-1 rounded">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="px-3 pb-4 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-50">
            <UserCircleIcon className="h-7 w-7 text-gray-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
              <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded mt-0.5 capitalize ${roleBadge[user?.role] || roleBadge.viewer}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
