import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, CreditCard, LayoutDashboard, LogOut, Settings, Users } from 'lucide-react';
import { clearSession, getSession } from '../utils/session';

const navigation = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'O\'qituvchilar', to: '/admin/teachers', icon: Users },
  { label: 'Guruhlar', to: '/admin/groups', icon: BookOpen },
  { label: 'To\'lovlar', to: '/admin/payments', icon: CreditCard },
  { label: 'Sozlamalar', to: '/admin/settings', icon: Settings }
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useMemo(() => getSession(), []);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  function logout() {
    clearSession();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_30%),linear-gradient(180deg,_#fffdf7_0%,_#f3f6fb_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 md:px-6 lg:px-8">
        <aside className={`fixed inset-y-4 left-4 z-30 w-72 rounded-[32px] border border-slate-200 bg-slate-950 p-5 text-white shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Everest CRM</p>
              <h2 className="mt-3 font-display text-3xl">Admin panel</h2>
            </div>
            <button className="rounded-full border border-white/15 px-3 py-2 text-xs lg:hidden" onClick={() => setSidebarOpen(false)}>Yopish</button>
          </div>
          <nav className="mt-8 space-y-2">
            {navigation.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <button
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${active ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Sessiya</p>
            <p className="mt-2 font-medium text-white">{session?.login}</p>
            <p className="text-slate-400">Administrator</p>
          </div>
          <button onClick={logout} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 font-medium text-slate-950 transition hover:bg-amber-300">
            <LogOut className="h-4 w-4" /> Chiqish
          </button>
        </aside>

        <div className="flex-1 lg:pl-0">
          <div className="mb-5 flex items-center justify-between rounded-[28px] border border-white/70 bg-white/70 px-5 py-4 shadow-sm backdrop-blur">
            <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium lg:hidden" onClick={() => setSidebarOpen(true)}>Menyu</button>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Boshqaruv</p>
              <h1 className="font-display text-2xl">Everest o'quv markazi</h1>
            </div>
            <div className="hidden rounded-2xl bg-slate-950 px-4 py-2 text-sm text-white md:block">Real-time boshqaruv paneli</div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
