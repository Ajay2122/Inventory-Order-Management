import { ArrowRightOnRectangleIcon, Bars3Icon, SignalSlashIcon } from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logout, selectUser } from '../../store/authSlice';
import { useServerStatus } from '../../hooks/useServerStatus';

const ConnectionPill = ({ status }) => {
  if (status === 'checking') {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
        Connecting
      </span>
    );
  }
  if (status === 'offline') {
    return (
      <span
        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200"
        title="Backend server is offline"
      >
        <SignalSlashIcon className="h-3 w-3" />
        Offline
      </span>
    );
  }
  return (
    <span
      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200"
      title="Backend connected"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      Connected
    </span>
  );
};

const Navbar = ({ onMenuToggle }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const { status } = useServerStatus();

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out');
    navigate('/login');
  };

  const firstName = user?.name?.split(' ')[0];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center px-5 gap-3">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <ConnectionPill status={status} />

      <div className="flex items-center gap-2.5">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-gray-900 leading-tight">{firstName}</p>
          <p className="text-xs text-gray-400 capitalize leading-tight">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Sign out"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          <span className="hidden sm:inline text-xs font-medium">Sign out</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
