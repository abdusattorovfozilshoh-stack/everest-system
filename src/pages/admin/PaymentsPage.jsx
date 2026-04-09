import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAdminData } from '../../app/useAdminData';
import { SectionHeader } from '../../components/shared/SectionHeader';
import { DataTable } from '../../components/shared/DataTable';
import { PageLoader } from '../../components/shared/PageLoader';
import { formatCurrency, formatDate } from '../../utils/format';

const initialForm = { studentName: '', groupId: '', month: '', amount: '', date: '', paid: true };

export function PaymentsPage() {
  const { groups, payments, loading, error, reload } = useAdminData();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const groupOptions = useMemo(() => groups.map((group) => ({ value: String(group.id), label: group.name })), [groups]);

  if (loading) return <PageLoader />;
  if (error) return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>;

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.payments.create({
        ...form,
        groupId: Number(form.groupId),
        amount: Number(form.amount)
      });
      setForm(initialForm);
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await api.payments.remove(id);
    await reload();
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader eyebrow="Moliya" title="To'lovlar nazorati" description="Talabalar to'lovlari, to'langan sana va qarzdorlik holatini shu sahifada boshqaring." />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DataTable
          columns={[
            { key: 'studentName', label: 'Talaba' },
            { key: 'groupId', label: 'Guruh', render: (row) => groupOptions.find((item) => Number(item.value) === row.groupId)?.label || '-' },
            { key: 'amount', label: 'Summa', render: (row) => formatCurrency(row.amount) },
            { key: 'date', label: 'Sana', render: (row) => formatDate(row.date) },
            { key: 'paid', label: 'Holat', render: (row) => <span className={`rounded-full px-3 py-1 text-xs font-medium ${row.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{row.paid ? 'To\'langan' : 'Qarzdor'}</span> },
            { key: 'actions', label: 'Amal', render: (row) => <button onClick={() => handleDelete(row.id)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-rose-600 transition hover:bg-rose-50"><Trash2 className="h-4 w-4" /> O'chirish</button> }
          ]}
          rows={[...payments].reverse()}
        />
        <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <div>
            <h2 className="font-display text-2xl text-slate-900">To'lov kiritish</h2>
            <p className="mt-2 text-sm text-slate-500">Manuel to'lov qo'shish, tarixni tozalash va statusni belgilash uchun.</p>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Talaba</span>
            <input required value={form.studentName} onChange={(event) => setForm((current) => ({ ...current, studentName: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Guruh</span>
            <select required value={form.groupId} onChange={(event) => setForm((current) => ({ ...current, groupId: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white">
              <option value="">Tanlang</option>
              {groupOptions.map((group) => <option key={group.value} value={group.value}>{group.label}</option>)}
            </select>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Oy</span>
              <input required value={form.month} onChange={(event) => setForm((current) => ({ ...current, month: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Summa</span>
              <input required type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white" />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">To'langan sana</span>
            <input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white" />
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-600">
            <input type="checkbox" checked={form.paid} onChange={(event) => setForm((current) => ({ ...current, paid: event.target.checked }))} className="h-4 w-4 rounded border-slate-300" />
            To'lov bajarilgan
          </label>
          <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:opacity-60">
            <Plus className="h-4 w-4" /> {saving ? 'Saqlanmoqda...' : "To'lov qo'shish"}
          </button>
        </form>
      </div>
    </div>
  );
}
