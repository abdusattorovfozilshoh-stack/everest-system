import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAdminData } from '../../app/useAdminData';
import { SectionHeader } from '../../components/shared/SectionHeader';
import { DataTable } from '../../components/shared/DataTable';
import { PageLoader } from '../../components/shared/PageLoader';

const initialForm = { ism: '', fam: '', tel: '', login: '', pass: '' };

export function TeachersPage() {
  const { teachers, loading, error, reload } = useAdminData();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  if (loading) return <PageLoader />;
  if (error) return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>;

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.teachers.create(form);
      setForm(initialForm);
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await api.teachers.remove(id);
    await reload();
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader eyebrow="Jamoa" title="O'qituvchilar bazasi" description="Yangi o'qituvchi qo'shing, login yarating va mavjud jamoani boshqaring." />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DataTable
          columns={[
            { key: 'fullName', label: 'O\'qituvchi', render: (row) => `${row.ism} ${row.fam}` },
            { key: 'tel', label: 'Telefon' },
            { key: 'login', label: 'Login' },
            { key: 'actions', label: 'Amal', render: (row) => <button onClick={() => handleDelete(row.id)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-rose-600 transition hover:bg-rose-50"><Trash2 className="h-4 w-4" /> O'chirish</button> }
          ]}
          rows={teachers}
        />
        <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <div>
            <h2 className="font-display text-2xl text-slate-900">Yangi o'qituvchi</h2>
            <p className="mt-2 text-sm text-slate-500">Minimal maydonlar bilan tezkor onboarding.</p>
          </div>
          {Object.entries({ ism: 'Ism', fam: 'Familiya', tel: 'Telefon', login: 'Login', pass: 'Parol' }).map(([key, label]) => (
            <label key={key} className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">{label}</span>
              <input
                type="text"
                required
                value={form[key]}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </label>
          ))}
          <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:opacity-60">
            <Plus className="h-4 w-4" /> {saving ? 'Saqlanmoqda...' : "O'qituvchi qo'shish"}
          </button>
        </form>
      </div>
    </div>
  );
}
