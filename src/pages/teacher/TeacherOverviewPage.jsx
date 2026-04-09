import { useMemo } from 'react';
import { SectionHeader } from '../../components/shared/SectionHeader';
import { PageLoader } from '../../components/shared/PageLoader';
import { StatCard } from '../../components/dashboard/StatCard';
import { DataTable } from '../../components/shared/DataTable';
import { useTeacherData } from '../../app/useTeacherData';
import { formatCurrency } from '../../utils/format';

export function TeacherOverviewPage() {
  const { teacher, groups, payments, loading, error } = useTeacherData();

  const summary = useMemo(() => ({
    students: groups.reduce((sum, group) => sum + (group.students?.length || 0), 0),
    revenue: payments.filter((payment) => payment.paid).reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    unpaid: payments.filter((payment) => !payment.paid).length
  }), [groups, payments]);

  if (loading) return <PageLoader />;
  if (error) return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>;

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader eyebrow="Teacher dashboard" title={`${teacher?.ism || ''} ${teacher?.fam || ''}`} description="Sizga biriktirilgan guruhlar, talabalar va to'lov holatini shu yerda kuzatib boring." />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Guruhlar" value={groups.length} />
        <StatCard label="Talabalar" value={summary.students} />
        <StatCard label="To'langan summa" value={formatCurrency(summary.revenue)} />
        <StatCard label="Qarzdorlar" value={summary.unpaid} />
      </div>
      <DataTable
        columns={[
          { key: 'name', label: 'Guruh' },
          { key: 'ts', label: 'Vaqt', render: (row) => `${row.ts} - ${row.te}` },
          { key: 'days', label: 'Kunlar', render: (row) => row.days.join(', ') },
          { key: 'students', label: 'Talabalar', render: (row) => row.students.length }
        ]}
        rows={groups}
        emptyText="Sizga guruh biriktirilmagan"
      />
    </div>
  );
}
