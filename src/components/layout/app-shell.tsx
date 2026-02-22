'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  PenTool,
  Wand2,
  BookOpen,
  Settings,
  CreditCard,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const navItems = [
  { name: 'Solve', href: '/solve', icon: Home },
  { name: 'Write', href: '/write', icon: PenTool },
  { name: 'Humanize', href: '/humanize', icon: Wand2 },
  { name: 'Learn', href: '/learn', icon: BookOpen },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user and their plan
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single();
        if (profile?.plan) setPlan(profile.plan as 'free' | 'pro');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  // Derive display info
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-[var(--color-bg0)] overflow-hidden">

      {/* Mobile Header & Nav Toggle */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-bg1)] fixed top-0 w-full z-50">
        <Link href="/" className="font-mono text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
          AXIOM<span className="text-[var(--color-ax-blue)]">.</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[var(--color-text-secondary)] hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[var(--color-bg1)] border-r border-[var(--color-border)]
        transform transition-transform duration-200 ease-in-out flex flex-col
        md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-[var(--color-border)] hidden md:flex">
          <Link href="/" className="font-mono text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            AXIOM<span className="text-[var(--color-ax-blue)]">.</span>
          </Link>
        </div>

        {/* Main Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 mt-16 md:mt-0 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname === '/' && item.href === '/solve');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all
                  ${isActive
                    ? 'bg-[var(--color-ax-blue)]/10 text-[var(--color-text-primary)] border border-[var(--color-ax-blue)]/20 shadow-[0_0_15px_rgba(96,165,250,0.05)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg2)] hover:text-[var(--color-text-primary)]'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[var(--color-ax-blue)]' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions / User */}
        <div className="p-4 border-t border-[var(--color-border)] space-y-2">
          {plan !== 'pro' && (
            <Link href="/pricing" className="flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg2)] transition-colors text-sm">
              <CreditCard className="w-4 h-4" /> Upgrade to Pro
            </Link>
          )}
          <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg2)] transition-colors text-sm">
            <Settings className="w-4 h-4" /> Settings
          </Link>

          {/* User Profile & Sign Out */}
          {user && (
            <div className="pt-2 border-t border-[var(--color-border)] mt-2">
              <div className="flex items-center gap-3 px-4 py-2.5">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full border border-[var(--color-border)]" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--color-ax-blue)]/15 border border-[var(--color-ax-blue)]/25 flex items-center justify-center">
                    <span className="text-xs font-bold text-[var(--color-ax-blue)]">{initials}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{displayName}</p>
                  <p className="text-xs text-[var(--color-dim)] truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-red-400 hover:bg-red-500/10 transition-colors text-sm w-full text-left disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:overflow-y-auto pt-16 md:pt-0">
        {/* Topbar with streak + usage */}
        <div className="h-14 flex items-center justify-between px-4 md:px-8 border-b border-[var(--color-border)] bg-[var(--color-bg1)]/80 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/8 border border-amber-500/15 rounded-full text-amber-400 text-xs font-mono font-semibold">
              🔥 <span>1</span>
            </div>
            <span className="text-xs text-[var(--color-dim)] hidden sm:inline">day streak</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-[var(--color-text-secondary)]">
              <span className="text-emerald-400 font-semibold">∞</span> solves left today
            </div>
            <div className="w-px h-5 bg-[var(--color-border)]" />
            <span className={`text-xs font-mono font-semibold ${plan === 'pro' ? 'text-[var(--color-ax-yellow)]' : 'text-[var(--color-dim)]'}`}>
              {plan === 'pro' ? 'PRO ✨' : 'FREE'}
            </span>
          </div>
        </div>
        <div className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
