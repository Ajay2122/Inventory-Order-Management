import { useState, useEffect, useCallback } from 'react';
import { pingServer } from '../services/api';

/**
 * Polls the backend health endpoint every 15 seconds.
 * Returns: 'checking' | 'online' | 'offline'
 */
export const useServerStatus = () => {
  const [status, setStatus] = useState('checking');

  const check = useCallback(async () => {
    const ok = await pingServer();
    setStatus(ok ? 'online' : 'offline');
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [check]);

  return { status, retry: check };
};
