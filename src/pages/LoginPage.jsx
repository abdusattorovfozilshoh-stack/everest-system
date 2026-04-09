import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BriefcaseBusiness, GraduationCap, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { getRememberedCredentials, saveRememberedCredentials, clearRememberedCredentials } from '../utils/remember';
import { getSession, saveSession } from '../utils/session';

const roles = [
  { key: 'admin', label: 'Administrator', caption: 'Markazning to\'liq boshqaruvi' },
  { key: 'teacher', label: 'O\'qituvchi', caption: 'Darslar va guruhlar bilan ishlash' }
];

const highlights = [
  { icon: ShieldCheck, title: 'Bitta markaziy tizim', text: 'O\'qituvchi, guruh va to\'lovlarni bitta interfeysdan boshqaring.' },
  { icon: GraduationCap, title: 'Real CRM oqimi', text: 'Page, component va routerlar production struktura asosida qurilgan.' },
  { icon: BriefcaseBusiness, title: 'Tezkor monitoring', text: 'Kunlik ish oqimi uchun aniq dashboard va soddalashtirilgan amallar.' }
];

export function LoginPage() {
  const navigate = useNavigate();
  const remembered = useMemo(() => getRememberedCredentials(), []);
  const [role, setRole] = useState('admin');
  const [form, setForm] = useState({ login: remembered.login, pass: remembered.pass, remember: Boolean(remembered.login) });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session?.role === 'admin') navigate('/admin', { replace: true });
    if (session?.role === 'teacher') navigate('/teacher', { replace: true });
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.login({ login: form.login.trim(), pass: form.pass.trim(), role });
      saveSession(result.user);

      if (form.remember) {
        saveRememberedCredentials(form.login.trim(), form.pass.trim());
      } else {
        clearRememberedCredentials();
      }

      navigate(role === 'admin' ? '/admin' : '/teacher', { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(140deg,_#0f172a_0%,_#1e293b_42%,_#f8fafc_42%,_#fffaf0_100%)] px-4 py-8 text-slate-900 md:px-8 lg:px-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl overflow-hidden rounded-[36px] border border-white/10 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.25)] backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden bg-slate-950 px-8 py-10 text-white md:px-12 lg:px-14 lg:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.25),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.2),_transparent_25%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-12">
            <div>
              <p className="text-sm uppercase tracking-[0.45em] text-amber-300">Everest CRM</p>
              <h1 className="mt-6 max-w-lg font-display text-5xl leading-tight text-white md:text-6xl">O'quv markazi uchun zamonaviy boshqaruv paneli</h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
                Legacy HTML va inline JavaScript o'rniga endi modulga ajratilgan, router bilan boshqariladigan va kengaytirishga tayyor React loyiha.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                    <Icon className="h-9 w-9 text-amber-300" />
                    <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[linear-gradient(180deg,_rgba(255,251,235,0.7)_0%,_rgba(255,255,255,0.95)_100%)] px-6 py-10 md:px-10">
          <div className="w-full max-w-xl space-y-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-amber-700">Kirish</p>
              <h2 className="mt-4 font-display text-4xl text-slate-950">Tizimga kirish</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">Rolni tanlang va tizimga xavfsiz kiring. Sessiya local storage orqali saqlanadi.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {roles.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setRole(item.key)}
                  className={`rounded-[24px] border px-4 py-4 text-left transition ${role === item.key ? 'border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/15' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'}`}
                >
                  <div className="font-semibold">{item.label}</div>
                  <div className={`mt-1 text-sm ${role === item.key ? 'text-slate-300' : 'text-slate-500'}`}>{item.caption}</div>
                </button>
              ))}
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Login</span>
                <input
                  type="text"
                  value={form.login}
                  onChange={(event) => setForm((current) => ({ ...current, login: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-amber-500 focus:bg-white"
                  placeholder="Login kiriting"
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Parol</span>
                <input
                  type="password"
                  value={form.pass}
                  onChange={(event) => setForm((current) => ({ ...current, pass: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-amber-500 focus:bg-white"
                  placeholder="Parol kiriting"
                  required
                />
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-500">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(event) => setForm((current) => ({ ...current, remember: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                Meni eslab qol
              </label>
              {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Tekshirilmoqda...' : 'Kirish'}
              </button>
            </form>

            <div className="rounded-[28px] border border-amber-100 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
              <p className="font-semibold">Demo ma'lumotlar</p>
              <p className="mt-2">Admin: `admin / admin123`</p>
              <p>Teacher: `aziza / aziza123`</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
