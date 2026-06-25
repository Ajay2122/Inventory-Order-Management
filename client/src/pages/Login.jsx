import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  LockClosedIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  SignalSlashIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { loginUser, registerUser, selectUser } from '../store/authSlice';
import { useServerStatus } from '../hooks/useServerStatus';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const DEMO_ACCOUNTS = [
  { role: 'Admin',   email: 'admin@inventory.com',   password: 'Admin@123'   },
  { role: 'Manager', email: 'manager@inventory.com', password: 'Manager@123' },
  { role: 'Viewer',  email: 'viewer@inventory.com',  password: 'Viewer@123'  },
];

const ServerStatusBar = ({ status, retry }) => {
  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 text-sm mb-5">
        <ArrowPathIcon className="h-4 w-4 animate-spin flex-shrink-0" />
        <span>Connecting to server…</span>
      </div>
    );
  }
  if (status === 'offline') {
    return (
      <div className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 mb-5">
        <div className="flex items-start gap-2">
          <SignalSlashIcon className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-700">Backend server is offline</p>
            <p className="text-xs text-red-500 mt-0.5">
              Run <code className="bg-red-100 px-1 rounded font-mono">npm start</code> inside the{' '}
              <code className="bg-red-100 px-1 rounded font-mono">server/</code> folder.
            </p>
          </div>
          <button onClick={retry} className="text-xs text-red-500 underline hover:text-red-700 flex-shrink-0">
            Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm mb-5">
      <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
      <span>Server is online</span>
    </div>
  );
};

const SignInForm = ({ status, onSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: { email: '', password: '' } });

  const fillDemo = (account) => {
    setValue('email',    account.email,    { shouldValidate: true, shouldDirty: true });
    setValue('password', account.password, { shouldValidate: true, shouldDirty: true });
    setActiveDemo(account.role);
  };

  const onSubmit = async (data) => {
    if (status === 'offline') {
      toast.error('Server is offline. Please start the backend first.');
      return;
    }
    setLoading(true);
    try {
      const result = await dispatch(loginUser(data));
      if (loginUser.fulfilled.match(result)) {
        toast.success('Welcome back!');
        onSuccess();
      } else {
        toast.error(result.payload || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          required
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
          })}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          required
          error={errors.password?.message}
          {...register('password', { required: 'Password is required' })}
        />
        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={loading}
          disabled={status === 'offline'}
        >
          <LockClosedIcon className="h-4 w-4" />
          {status === 'offline' ? 'Server Offline' : 'Sign In'}
        </Button>
      </form>

      {/* Demo accounts */}
      <div className="mt-6 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
          Demo accounts — click to fill
        </p>
        <div className="space-y-1.5">
          {DEMO_ACCOUNTS.map((account) => {
            const active = activeDemo === account.role;
            return (
              <button
                key={account.role}
                type="button"
                onClick={() => fillDemo(account)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span className="font-semibold">{account.role}</span>
                <span className="font-mono text-gray-400">{account.email}</span>
              </button>
            );
          })}
        </div>
      </div>

      {status === 'offline' && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 space-y-1.5">
          <p className="font-semibold">Quick start:</p>
          <p>1. Make sure MongoDB is running</p>
          <p>2. <code className="bg-amber-100 px-1 rounded font-mono">cd server &amp;&amp; npm start</code></p>
          <p>3. First time? Run <code className="bg-amber-100 px-1 rounded font-mono">node seeds/seed.js</code></p>
        </div>
      )}
    </>
  );
};

const SignUpForm = ({ status, onSuccess, onSwitchToSignIn }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { name: '', email: '', password: '', confirmPassword: '' } });

  const password = watch('password');

  const onSubmit = async (data) => {
    if (status === 'offline') {
      toast.error('Server is offline. Please start the backend first.');
      return;
    }
    setLoading(true);
    try {
      const result = await dispatch(registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      }));
      if (registerUser.fulfilled.match(result)) {
        toast.success('Account created! Welcome to StockFlow.');
        onSuccess();
      } else {
        toast.error(result.payload || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-4 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
        New accounts are granted <span className="font-semibold">Viewer</span> access. An admin can upgrade your role after signup.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="e.g. Jane Smith"
          required
          error={errors.name?.message}
          {...register('name', {
            required: 'Full name is required',
            maxLength: { value: 50, message: 'Max 50 characters' },
            minLength: { value: 2, message: 'Name must be at least 2 characters' },
          })}
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          required
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
          })}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min. 6 characters"
          required
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' },
          })}
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (val) => val === password || 'Passwords do not match',
          })}
        />
        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={loading}
          disabled={status === 'offline'}
        >
          <UserPlusIcon className="h-4 w-4" />
          {status === 'offline' ? 'Server Offline' : 'Create Account'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Sign in
        </button>
      </p>
    </>
  );
};

const Login = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin');
  const { status, retry } = useServerStatus();

  if (user) return <Navigate to="/" replace />;

  const handleSuccess = () => navigate('/', { replace: true });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-white/25 flex items-center justify-center">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl">StockFlow</span>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white leading-tight">
            Inventory &amp; Orders,<br />made simple.
          </h2>
          <p className="mt-3 text-blue-100 text-sm leading-relaxed max-w-xs">
            Track stock levels, process customer orders, and get alerts when products run low.
          </p>
          <div className="mt-8 space-y-2.5">
            {[
              'Real-time stock tracking',
              'Role-based access control',
              'Order management with audit trail',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-blue-100">
                <CheckCircleIcon className="h-4 w-4 text-blue-200 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-200/50 text-xs">Built with MERN Stack</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <span className="text-gray-900 font-bold text-xl">StockFlow</span>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === 'signin'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          {mode === 'signin' ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
              <p className="text-gray-500 text-sm mt-1 mb-6">Enter your credentials to access the dashboard</p>
              <ServerStatusBar status={status} retry={retry} />
              <SignInForm status={status} onSuccess={handleSuccess} />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
              <p className="text-gray-500 text-sm mt-1 mb-6">Get started with StockFlow today</p>
              <ServerStatusBar status={status} retry={retry} />
              <SignUpForm
                status={status}
                onSuccess={handleSuccess}
                onSwitchToSignIn={() => setMode('signin')}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
