import { useMemo } from 'react';
import { SectionHeader } from '../../components/shared/SectionHeader';
import { PageLoader } from '../../components/shared/PageLoader';
import { StatCard } from '../../components/dashboard/StatCard';
import { DataTable } from '../../components/shared/DataTable';
import { useAdminData } from '../../app/useAdminData';
import { formatCurrency, summarizeDashboard } from '../../utils/format';

export function AdminOverviewPage() {
  const { teachers, groups, payments, loading, error } = useAdminData();
  const summary = useMemo(() => summarizeDashboard({ teachers, groups, payments }), [teachers, groups, payments]);

  if (loading) return <PageLoader />;
  if (error) return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>;

  const recentPayments = [...payments].slice(-5).reverse();

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        eyebrow="Admin dashboard"
        title="Markaz holati bir ekranda"
        description="Asosiy KPI'lar, so'nggi to'lovlar va umumiy markaz aktivligini shu yerdan kuzatib boring."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="O'qituvchilar" value={summary.teacherCount} />
        <StatCard label="Guruhlar" value={summary.groupCount} />
        <StatCard label="Talabalar" value={summary.totalStudents} />
        <StatCard label="To'langan summa" value={formatCurrency(summary.monthlyRevenue)} />
        <StatCard label="Qarzdorlar" value={summary.unpaidCount} hint="e'tibor kerak" />
      </div>
      <DataTable
        columns={[
          { key: 'studentName', label: 'Talaba' },
          { key: 'month', label: 'Oy' },
          { key: 'amount', label: 'Summa', render: (row) => formatCurrency(row.amount) },
          { key: 'paid', label: 'Holat', render: (row) => <span className={`rounded-full px-3 py-1 text-xs font-medium ${row.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{row.paid ? 'To\'langan' : 'Kutilmoqda'}</span> }
        ]}
        rows={recentPayments}
        emptyText="To'lovlar hali yo'q"
      />
    </div>
  );
}
