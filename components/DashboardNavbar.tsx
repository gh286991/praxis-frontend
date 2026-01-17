'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import { useAppSelector } from '@/lib/store';
import { useRouter } from 'next/navigation';

export function DashboardNavbar() {
  const router = useRouter();
  const user = useAppSelector((state) => state.user.profile);

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    // dispatch(logout()); // If you have a logout action
    router.push('/login');
  };

  return (
    <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-4 group">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              {/* Logo Placeholder - replaced img with a CSS-only version if image not available, or keep img if stable */}
              <div className="flex items-center justify-center w-full h-full bg-slate-900 border border-slate-700 rounded text-indigo-500 font-bold relative z-10">
                P
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300 tracking-wider">
                PRAXIS
              </h1>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase">
                Dashboard Module
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="flex items-center gap-3">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
                  >
                    <Avatar className="h-9 w-9 border border-slate-700 group-hover:border-indigo-500 transition-all ring-2 ring-transparent group-hover:ring-indigo-500/20">
                      <AvatarImage src={user.picture} alt={user.name} />
                      <AvatarFallback className="bg-slate-800 text-indigo-400 font-bold">
                        {user.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200 transition-colors uppercase tracking-wider">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Authorized User
                      </p>
                    </div>
                  </Link>
                </div>
                <div className="h-6 w-px bg-slate-700 mx-2" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
