'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Crown, CreditCard, Mail, Calendar, Loader2, ExternalLink, Shield } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type Profile = {
  plan: 'free' | 'pro';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('plan, stripe_customer_id, stripe_subscription_id, created_at')
          .eq('id', user.id)
          .single() as { data: Profile | null };
        setProfile(data);
      }
      setLoading(false);
    });
  }, []);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create portal session');
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
      alert('Error opening subscription management. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const { STRIPE_PRICES } = await import('@/lib/stripe/config');
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: STRIPE_PRICES.MONTHLY }),
      });
      if (!res.ok) throw new Error('Failed to create checkout session');
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
      alert('Error initiating checkout. Please try again.');
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-ax-blue)]" />
      </div>
    );
  }

  const isPro = profile?.plan === 'pro';

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <header>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-primary)]">Settings</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">Manage your account and subscription</p>
      </header>

      {/* ── Profile Card ── */}
      <div className="bg-[var(--color-bg1)] border border-[var(--color-border2)] rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-14 h-14 rounded-full border-2 border-[var(--color-border)]" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[var(--color-ax-blue)]/15 border-2 border-[var(--color-ax-blue)]/25 flex items-center justify-center">
              <User className="w-6 h-6 text-[var(--color-ax-blue)]" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{displayName}</h2>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <Mail className="w-3.5 h-3.5" />
              {user?.email}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[var(--color-bg0)] rounded-xl p-4 border border-[var(--color-border)]">
            <div className="flex items-center gap-2 text-xs text-[var(--color-dim)] mb-1 uppercase tracking-wider font-mono">
              <Calendar className="w-3.5 h-3.5" />
              Member since
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{memberSince}</p>
          </div>
          <div className="bg-[var(--color-bg0)] rounded-xl p-4 border border-[var(--color-border)]">
            <div className="flex items-center gap-2 text-xs text-[var(--color-dim)] mb-1 uppercase tracking-wider font-mono">
              <Shield className="w-3.5 h-3.5" />
              Auth provider
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] capitalize">
              {user?.app_metadata?.provider || 'Email'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Plan Card ── */}
      <div className={`bg-[var(--color-bg1)] border rounded-2xl p-6 ${
        isPro ? 'border-[var(--color-ax-yellow)]/30 shadow-[0_0_40px_rgba(250,204,21,0.05)]' : 'border-[var(--color-border2)]'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPro ? 'bg-[var(--color-ax-yellow)]/10 border border-[var(--color-ax-yellow)]/20' : 'bg-[var(--color-bg2)] border border-[var(--color-border)]'
            }`}>
              <Crown className={`w-5 h-5 ${isPro ? 'text-[var(--color-ax-yellow)]' : 'text-[var(--color-dim)]'}`} />
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-text-primary)]">
                {isPro ? 'Axiom Pro' : 'Free Plan'}
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {isPro ? 'Unlimited access to all features' : '3 solves, 500 words, 1 write per day'}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono ${
            isPro
              ? 'bg-[var(--color-ax-yellow)]/10 text-[var(--color-ax-yellow)] border border-[var(--color-ax-yellow)]/20'
              : 'bg-[var(--color-bg2)] text-[var(--color-dim)] border border-[var(--color-border)]'
          }`}>
            {isPro ? 'PRO ✨' : 'FREE'}
          </span>
        </div>

        {isPro ? (
          <div className="space-y-3">
            <div className="bg-[var(--color-bg0)] rounded-xl p-4 border border-[var(--color-border)]">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-[var(--color-dim)] uppercase tracking-wider font-mono mb-1">Billing</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">$9.99/month</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-dim)] uppercase tracking-wider font-mono mb-1">Status</p>
                  <p className="font-semibold text-emerald-400">Active</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-bg2)] border border-[var(--color-border2)] text-[var(--color-text-secondary)] font-semibold rounded-xl hover:bg-[var(--color-bg3)] hover:text-[var(--color-text-primary)] transition-all disabled:opacity-50"
            >
              {portalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              {portalLoading ? 'Opening...' : 'Manage Subscription'}
              {!portalLoading && <ExternalLink className="w-3.5 h-3.5" />}
            </button>
          </div>
        ) : (
          <button
            onClick={handleUpgrade}
            className="w-full py-3 bg-[var(--color-ax-yellow)] hover:bg-yellow-400 text-black font-bold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]"
          >
            Upgrade to Pro — $9.99/month
          </button>
        )}
      </div>
    </div>
  );
}
