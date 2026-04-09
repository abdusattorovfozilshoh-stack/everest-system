import { useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../../services/api';
import { SectionHeader } from '../../components/shared/SectionHeader';
import { PageLoader } from '../../components/shared/PageLoader';
import { useTeacherData } from '../../app/useTeacherData';

export function TeacherProfilePage() {
  const { teacher, loading, error, reload } = useTeacherData();
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) return <PageLoader />;
  if (error) return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>;
  if (!teacher) return <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-700">O'qituvchi ma'lumoti topilmadi.</div>;

  async function updatePassword(event) {
    event.preventDefault();
    if (!password.trim()) return;
    setSaving(true);
    try {
      await api.teachers.update(teacher.id, { ...teacher, pass: password.trim() });
      setPassword('');
      await reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader eyebrow="Profile" title="Shaxsiy kabinet" description="Kontakt ma'lumotlari va parolni yangilash uchun minimal profil sahifa." />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <h2 className="font-display text-2xl text-slate-900">Ma'lumotlar</h2>
          <div className="grid gap-4 text-sm text-slate-600">
            <div><span className="font-medium text-slate-900">Ism:</span> {teacher.ism}</div>
            <div><span className="font-medium text-slate-900">Familiya:</span> {teacher.fam}</div>
            <div><span className="font-medium text-slate-900">Telefon:</span> {teacher.tel}</div>
            <div><span className="font-medium text-slate-900">Login:</span> {teacher.login}</div>
          </div>
        </div>
        <form onSubmit={updatePassword} className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <div>
            <h2 className="font-display text-2xl text-slate-900">Parolni yangilash</h2>
            <p className="mt-2 text-sm text-slate-500">O'qituvchi o'z profilidan parolni o'zgartira oladi.</p>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Yangi parol</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white" />
          </label>
          <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:opacity-60">
            <Save className="h-4 w-4" /> {saving ? 'Saqlanmoqda...' : 'Parolni saqlash'}
          </button>
        </form>
      </div>
    </div>
  );
}
