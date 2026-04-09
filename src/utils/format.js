export const weekDays = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

export function formatCurrency(value) {
  return new Intl.NumberFormat('uz-UZ').format(Number(value || 0)) + ' so\'m';
}

export function formatDate(value) {
  if (!value) return 'Kiritilmagan';
  return new Intl.DateTimeFormat('uz-UZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value));
}

export function createGroupName(level, suffix) {
  return suffix ? `${level} (${suffix})` : level;
}

export function summarizeDashboard({ teachers, groups, payments }) {
  const totalStudents = groups.reduce((sum, group) => sum + (group.students?.length || 0), 0);
  const monthlyRevenue = payments
    .filter((payment) => payment.paid)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const unpaidCount = payments.filter((payment) => !payment.paid).length;

  return {
    teacherCount: teachers.length,
    groupCount: groups.length,
    totalStudents,
    monthlyRevenue,
    unpaidCount
  };
}
