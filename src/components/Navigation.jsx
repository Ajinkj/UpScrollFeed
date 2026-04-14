"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/firebase/auth';
import { Compass, UserCircle, LogOut } from 'lucide-react';

export default function Navigation() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (pathname === '/session') return null;

  return (
    <nav className="w-full bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <Compass className="text-indigo-500 group-hover:rotate-45 transition-transform" />
              <span className="font-bold text-xl tracking-tight text-white">CogiGame</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {!loading && user ? (
              <>
                <Link 
                  href="/dashboard"
                  className="text-slate-300 hover:text-white font-medium flex items-center gap-2 transition-colors"
                >
                  <UserCircle size={20} />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : !loading && !user ? (
              <Link
                href="/login"
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
              >
                Sign In
              </Link>
            ) : null}
          </div>

        </div>
      </div>
    </nav>
  );
}
