import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAdminData } from '../../app/useAdminData';
import { SectionHeader } from '../../components/shared/SectionHeader';
import { DataTable } from '../../components/shared/DataTable';
import { PageLoader } from '../../components/shared/PageLoader';
import { createGroupName, formatCurrency, weekDays } from '../../utils/format';

const initialForm = { teacherId: '', level: '', suffix: '', fee: '', ts: '', te: '', days: [] };

export function GroupsPage() {
  const { teachers, groups, loading, error, reload } = useAdminData();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const teacherOptions = useMemo(() => teachers.map((teacher) => ({ value: String(teacher.id), label: `${teacher.ism} ${teacher.fam}` })), [teachers]);

  if (loading) return <PageLoader />;
  if (error) return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>;

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        teacherId: Number(form.teacherId),
        level: form.level,
        suffix: form.suffix,
        name: createGroupName(form.level, form.suffix),
        fee: Number(form.fee),
        ts: form.ts,
        te: form.te,
        days: form.days,
        students: []
      };
      await api.groups.create(payload);
      setForm(initialForm);
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await api.groups.remove(id);
    await reload();
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader eyebrow="Akademik oqim" title="Guruhlar boshqaruvi" description="Dars vaqtlari, o'qituvchi biriktirish va narxlarni markaziy tarzda yuriting." />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DataTable
          columns={[
            { key: 'name', label: 'Guruh' },
            { key: 'teacherId', label: 'O\'qituvchi', render: (row) => teacherOptions.find((item) => Number(item.value) === row.teacherId)?.label || '-' },
            { key: 'fee', label: 'Oylik to\'lov', render: (row) => formatCurrency(row.fee) },
            { key: 'days', label: 'Kunlar', render: (row) => row.days.join(', ') },
            { key: 'actions', label: 'Amal', render: (row) => <button onClick={() => handleDelete(row.id)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-rose-600 transition hover:bg-rose-50"><Trash2 className="h-4 w-4" /> O'chirish</button> }
          ]}
          rows={groups}
        />
        <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <div>
            <h2 className="font-display text-2xl text-slate-900">Yangi guruh</h2>
            <p className="mt-2 text-sm text-slate-500">O'qituvchi, daraja va dars vaqtlarini bir joyda sozlang.</p>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">O'qituvchi</span>
            <select required value={form.teacherId} onChange={(event) => setForm((current) => ({ ...current, teacherId: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white">
              <option value="">Tanlang</option>
              {teacherOptions.map((teacher) => <option key={teacher.value} value={teacher.value}>{teacher.label}</option>)}
            </select>
          </label>
          {['level', 'suffix', 'fee', 'ts', 'te'].map((key) => (
            <label key={key} className="block space-y-2">
              <span className="text-sm font-medium capitalize text-slate-700">{key === 'ts' ? 'Boshlanish vaqti' : key === 'te' ? 'Tugash vaqti' : key === 'fee' ? 'Narx' : key === 'level' ? 'Daraja' : "Qo'shimcha nom"}</span>
              <input
                required={key !== 'suffix'}
                type={key === 'fee' ? 'number' : key.includes('t') ? 'time' : 'text'}
                value={form[key]}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </label>
          ))}
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Dars kunlari</span>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((day) => {
                const active = form.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, days: active ? current.days.filter((item) => item !== day) : [...current.days, day] }))}
                    className={`rounded-full px-4 py-2 text-sm transition ${active ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
          <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:opacity-60">
            <Plus className="h-4 w-4" /> {saving ? 'Saqlanmoqda...' : "Guruh qo'shish"}
          </button>
        </form>
      </div>
    </div>
  );
}
