'use client';

import type { User as SupabaseUser } from '@supabase/supabase-js';
import { User, Crown, CreditCard, Mail, Calendar, Loader2, ExternalLink, Shield, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

import { createClient } from '@/lib/supabase/client';

type Profile = {
  plan: 'free' | 'pro' | 'elite';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  badges: string[] | null;
};

export default function SettingsPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const t = useTranslations('Dashboard.Settings');

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('plan, stripe_customer_id, stripe_subscription_id, created_at, badges')
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

  const [isYearly, setIsYearly] = useState(false);

  const handleUpgrade = async () => {
    try {
      const { STRIPE_PRICES } = await import('@/lib/stripe/config');
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: isYearly ? STRIPE_PRICES.PRO_YEARLY : STRIPE_PRICES.PRO_MONTHLY }),
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

  const isPro = profile?.plan === 'pro' || profile?.plan === 'elite';

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <header>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-primary)]">{t('title')}</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">{t('description')}</p>
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
              {t('memberSince')}
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{memberSince}</p>
          </div>
          <div className="bg-[var(--color-bg0)] rounded-xl p-4 border border-[var(--color-border)]">
            <div className="flex items-center gap-2 text-xs text-[var(--color-dim)] mb-1 uppercase tracking-wider font-mono">
              <Shield className="w-3.5 h-3.5" />
              {t('authProvider')}
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] capitalize">
              {user?.app_metadata?.provider || 'Email'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Achievements Card ── */}
      <div className="bg-[var(--color-bg1)] border border-[var(--color-border2)] rounded-2xl p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            🏆 {t('achievements')}
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">{t('achievementsDesc')}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Badge 1: 1-Week Scholar */}
          <div className={`flex flex-col items-center justify-center p-4 rounded-xl border ${
            profile?.badges?.includes('1_week_scholar')
              ? 'bg-[var(--color-ax-yellow)]/10 border-[var(--color-ax-yellow)]/20'
              : 'bg-[var(--color-bg0)] border-[var(--color-border)] opacity-60 grayscale'
          }`}>
            <div className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center ${
              profile?.badges?.includes('1_week_scholar') ? 'bg-[var(--color-ax-yellow)]/20 text-[var(--color-ax-yellow)]' : 'bg-[var(--color-bg2)] text-[var(--color-dim)]'
            }`}>
              🔥
            </div>
            <p className="font-bold text-sm text-[var(--color-text-primary)] text-center">{t('scholar7')}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] text-center mt-1">
              {t('scholar7Desc')}
            </p>
          </div>

          {/* Badge 2: Monthly Master */}
          <div className={`flex flex-col items-center justify-center p-4 rounded-xl border ${
            profile?.badges?.includes('monthly_master')
              ? 'bg-[var(--color-ax-blue)]/10 border-[var(--color-ax-blue)]/20'
              : 'bg-[var(--color-bg0)] border-[var(--color-border)] opacity-60 grayscale'
          }`}>
            <div className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center ${
              profile?.badges?.includes('monthly_master') ? 'bg-[var(--color-ax-blue)]/20 text-[var(--color-ax-blue)]' : 'bg-[var(--color-bg2)] text-[var(--color-dim)]'
            }`}>
              🎖️
            </div>
            <p className="font-bold text-sm text-[var(--color-text-primary)] text-center">{t('master30')}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] text-center mt-1">
              {t('master30Desc')}
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
                {isPro ? t('planPro') : t('planFree')}
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {isPro ? t('planProDesc') : t('planFreeDesc')}
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
                  <p className="text-xs text-[var(--color-dim)] uppercase tracking-wider font-mono mb-1">{t('billing')}</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{t('managedViaStripe')}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-dim)] uppercase tracking-wider font-mono mb-1">{t('status')}</p>
                  <p className="font-semibold text-emerald-400">{t('active')}</p>
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
              {portalLoading ? t('opening') : t('manageSubscription')}
              {!portalLoading && <ExternalLink className="w-3.5 h-3.5" />}
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-center gap-3 bg-[var(--color-bg0)] p-2 rounded-xl border border-[var(--color-border)] w-full max-w-[280px] mx-auto">
              <button
                onClick={() => setIsYearly(false)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!isYearly ? 'bg-[var(--color-bg2)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-dim)]'}`}
              >
                {t('monthly')}
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${isYearly ? 'bg-[var(--color-bg2)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-dim)]'}`}
              >
                {t('yearly')} <span className="text-[var(--color-ax-green)] ml-1">-30%</span>
              </button>
            </div>
            <button
              onClick={handleUpgrade}
              className="w-full py-3 bg-[var(--color-ax-yellow)] hover:bg-yellow-400 text-black font-bold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]"
            >
              {t('upgradeToProPricing')}{isYearly ? '$6.99/mo' : '$9.99/mo'}
            </button>
          </div>
        )}
      </div>
      {/* ── Danger Zone ── */}
      <div className="bg-[var(--color-bg1)] border border-red-500/20 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-red-500/10">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-red-400">Danger Zone</h2>
        </div>

        {!deleteConfirm ? (
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="px-6 py-2.5 text-sm font-bold rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Delete my account
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-400 font-medium">
              Are you absolutely sure? All your data, usage history, and subscription will be permanently deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setDeleteLoading(true);
                  try {
                    const res = await fetch('/api/account/delete', { method: 'DELETE' });
                    if (res.ok) {
                      const supabase = createClient();
                      await supabase.auth.signOut();
                      window.location.href = '/';
                    } else {
                      alert('Failed to delete account. Please try again.');
                    }
                  } catch {
                    alert('Error deleting account.');
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
                disabled={deleteLoading}
                className="px-6 py-2.5 text-sm font-bold rounded-xl bg-red-500 text-white hover:bg-red-400 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, delete my account'}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-6 py-2.5 text-sm font-bold rounded-xl bg-[var(--color-bg2)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
