import { useEffect, useState } from 'react';
import { api } from '../services/api';

export function useAdminData() {
  const [state, setState] = useState({
    teachers: [],
    groups: [],
    payments: [],
    settings: null,
    loading: true,
    error: ''
  });

  async function load() {
    try {
      setState((current) => ({ ...current, loading: true, error: '' }));
      const [teachers, groups, payments, settings] = await Promise.all([
        api.teachers.list(),
        api.groups.list(),
        api.payments.list(),
        api.settings.get()
      ]);
      setState({ teachers, groups, payments, settings, loading: false, error: '' });
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message }));
    }
  }

  useEffect(() => {
    load();
  }, []);

  return {
    ...state,
    reload: load
  };
}
