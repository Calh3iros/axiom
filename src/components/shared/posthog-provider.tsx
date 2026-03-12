"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false, // We capture manually below
      capture_pageleave: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") ph.debug();
      },
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

/** Captures a pageview on every route change */
export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      const search = searchParams.toString();
      if (search) url += "?" + search;
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}
