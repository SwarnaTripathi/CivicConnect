import { useState, useEffect, useCallback } from 'react';
import { getTickets } from '../lib/api';

export function useTickets(params = {}, pollInterval = 30000) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0, critical: 0 });

  const fetch = useCallback(async () => {
    try {
      const res = await getTickets(params);
      const data = res.data.tickets || res.data || [];
      setTickets(data);
      setStats({
        total: data.length,
        open: data.filter(t => t.status !== 'Resolved').length,
        resolved: data.filter(t => t.status === 'Resolved').length,
        critical: data.filter(t => t.priority === 'Critical').length,
      });
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetch();
    if (pollInterval > 0) {
      const id = setInterval(fetch, pollInterval);
      return () => clearInterval(id);
    }
  }, [fetch, pollInterval]);

  return { tickets, loading, error, stats, refetch: fetch };
}
