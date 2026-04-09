import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { getSession } from '../utils/session';

export function useTeacherData() {
  const session = getSession();
  const [state, setState] = useState({
    teacher: null,
    groups: [],
    payments: [],
    loading: true,
    error: ''
  });

  async function load() {
    try {
      setState((current) => ({ ...current, loading: true, error: '' }));
      const [teachers, groups, payments] = await Promise.all([
        api.teachers.list(),
        api.groups.list(),
        api.payments.list()
      ]);
      const teacher = teachers.find((item) => item.id === session?.teacherId) || null;
      const teacherGroups = groups.filter((group) => group.teacherId === session?.teacherId);
      const teacherPayments = payments.filter((payment) => teacherGroups.some((group) => group.id === payment.groupId));
      setState({ teacher, groups: teacherGroups, payments: teacherPayments, loading: false, error: '' });
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
