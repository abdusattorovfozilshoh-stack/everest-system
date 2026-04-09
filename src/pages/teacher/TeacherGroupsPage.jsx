import { SectionHeader } from '../../components/shared/SectionHeader';
import { DataTable } from '../../components/shared/DataTable';
import { PageLoader } from '../../components/shared/PageLoader';
import { useTeacherData } from '../../app/useTeacherData';
import { formatCurrency } from '../../utils/format';

export function TeacherGroupsPage() {
  const { groups, loading, error } = useTeacherData();

  if (loading) return <PageLoader />;
  if (error) return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>;

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader eyebrow="Groups" title="Mening guruhlarim" description="Biriktirilgan guruhlar, dars vaqti va talabalar ro'yxati bir jadvalda." />
      <DataTable
        columns={[
          { key: 'name', label: 'Guruh' },
          { key: 'fee', label: 'Narx', render: (row) => formatCurrency(row.fee) },
          { key: 'schedule', label: 'Jadval', render: (row) => `${row.days.join(', ')} | ${row.ts} - ${row.te}` },
          { key: 'students', label: 'Talabalar', render: (row) => row.students.map((student) => student.name).join(', ') || '-' }
        ]}
        rows={groups}
      />
    </div>
  );
}
