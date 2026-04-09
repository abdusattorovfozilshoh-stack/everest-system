import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../../services/api';
import { useAdminData } from '../../app/useAdminData';
import { SectionHeader } from '../../components/shared/SectionHeader';
import { PageLoader } from '../../components/shared/PageLoader';

export function SettingsPage() {
  const { settings, loading, error, reload } = useAdminData();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        ...settings,
        courses: (settings.courses || []).map((course) => ({ ...course }))
      });
    }
  }, [settings]);

  if (loading || !form) return <PageLoader />;
  if (error) return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>;

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.settings.save({
        ...form,
        groupCapacity: Number(form.groupCapacity)
      });
      await reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader eyebrow="Platform settings" title="Markaz sozlamalari" description="Admin login, aloqa ma'lumotlari va kurs narxlarini yangilash uchun konfiguratsiya paneli." />
      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <h2 className="font-display text-2xl text-slate-900">Umumiy ma'lumotlar</h2>
          {[
            ['centerName', 'Markaz nomi'],
            ['centerAddr', 'Manzil'],
            ['centerPhone', 'Telefon'],
            ['centerEmail', 'Email'],
            ['adminLogin', 'Admin login'],
            ['adminPass', 'Admin parol'],
            ['groupCapacity', "Guruh sig'imi"]
          ].map(([key, label]) => (
            <label key={key} className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">{label}</span>
              <input
                type={key === 'groupCapacity' ? 'number' : 'text'}
                value={form[key] ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </label>
          ))}
        </div>
        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <div>
            <h2 className="font-display text-2xl text-slate-900">Kurs narxlari</h2>
            <p className="mt-2 text-sm text-slate-500">Mavjud kurslar bo'yicha oylik narxlarni boshqaring.</p>
          </div>
          {(form.courses || []).map((course, index) => (
            <div key={course.key || index} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-medium text-slate-800">{course.key}</p>
                <p className="text-sm text-slate-500">Daraja bo'yicha oylik to'lov</p>
              </div>
              <input
                type="number"
                value={course.fee}
                onChange={(event) => {
                  const value = event.target.value;
                  setForm((current) => ({
                    ...current,
                    courses: current.courses.map((item, courseIndex) => courseIndex === index ? { ...item, fee: Number(value) } : item)
                  }));
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400 md:w-44"
              />
            </div>
          ))}
          <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:opacity-60">
            <Save className="h-4 w-4" /> {saving ? 'Saqlanmoqda...' : 'Sozlamalarni saqlash'}
          </button>
        </div>
      </form>
    </div>
  );
}
