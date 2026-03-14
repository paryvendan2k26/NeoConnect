'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FileText, PlusCircle, Globe, BarChart2,
  Users, LogOut, ChevronRight, ShieldCheck, Vote
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',       label: 'Dashboard',   icon: LayoutDashboard, roles: ['staff','secretariat','case_manager','admin'] },
  { href: '/cases',           label: 'All Cases',   icon: FileText,        roles: ['secretariat','admin'] },
  { href: '/cases/my-cases',  label: 'My Cases',    icon: ShieldCheck,     roles: ['case_manager'] },
  { href: '/cases/new',       label: 'Submit Issue', icon: PlusCircle,     roles: ['staff','admin'] },
  { href: '/polls',           label: 'Polls',        icon: Vote,           roles: ['staff','secretariat','case_manager','admin'] },
  { href: '/hub',             label: 'Public Hub',   icon: Globe,          roles: ['staff','secretariat','case_manager','admin'] },
  { href: '/analytics',       label: 'Analytics',    icon: BarChart2,      roles: ['secretariat','admin'] },
  { href: '/admin',           label: 'User Admin',   icon: Users,          roles: ['admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const filtered = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="font-bold text-sm">N</span>
          </div>
          <span className="font-bold text-lg tracking-tight">NeoConnect</span>
        </div>
      </div>

      <div className="px-4 py-4 border-b border-slate-700">
        <div className="bg-slate-800 rounded-lg px-3 py-2">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {filtered.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white w-full transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}