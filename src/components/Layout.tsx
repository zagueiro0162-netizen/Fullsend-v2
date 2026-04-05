import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Wrench, Calendar, User as UserIcon, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import AISupport from './AISupport';

export default function Layout() {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { name: 'Início', path: '/', icon: Home },
    { name: 'Serviços', path: '/services', icon: Wrench },
    { name: 'Agendar', path: '/booking', icon: Calendar },
    { name: 'Perfil', path: '/dashboard', icon: UserIcon },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin', path: '/admin', icon: Settings });
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold italic text-white">FS</div>
          <h1 className="text-xl font-bold tracking-tight">
            FullSend <span className="text-red-500">Performance</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* AI Support Widget */}
      <AISupport />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-6 py-3 flex justify-between items-center z-50 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors",
                isActive ? "text-red-500" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
