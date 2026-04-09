import { SectionHeader } from '../../components/shared/SectionHeader';
import { DataTable } from '../../components/shared/DataTable';
import { PageLoader } from '../../components/shared/PageLoader';
import { useTeacherData } from '../../app/useTeacherData';
import { formatCurrency, formatDate } from '../../utils/format';

export function TeacherPaymentsPage() {
  const { payments, loading, error } = useTeacherData();

  if (loading) return <PageLoader />;
  if (error) return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>;

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader eyebrow="Finance" title="Guruhlarim bo'yicha to'lovlar" description="Talabalar kesimida to'lov sanasi, summa va qarzdorlik holatini kuzatib boring." />
      <DataTable
        columns={[
          { key: 'studentName', label: 'Talaba' },
          { key: 'month', label: 'Oy' },
          { key: 'amount', label: 'Summa', render: (row) => formatCurrency(row.amount) },
          { key: 'date', label: 'Sana', render: (row) => formatDate(row.date) },
          { key: 'paid', label: 'Holat', render: (row) => <span className={`rounded-full px-3 py-1 text-xs font-medium ${row.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{row.paid ? 'To\'langan' : 'Kutilmoqda'}</span> }
        ]}
        rows={payments}
      />
    </div>
  );
}
