"use client";

import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { HelpGuide } from "./help-guide";
import { ROLE_HIERARCHY } from "@/types/roles";

export function HelpFab() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string>("student");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoaded(true);
        return;
      }
      const { data: membershipsData } = await supabase
        .from("org_memberships")
        .select("role")
        .eq("user_id", user.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const memberships = membershipsData as any[] | null;
      
      let highestRole = "student";
      if (memberships && memberships.length > 0) {
        let highest = -1;
        for (const m of memberships) {
          const l = ROLE_HIERARCHY[m.role] || 0;
          if (l > highest) {
            highest = l;
            highestRole = m.role;
          }
        }
      }
      setRole(highestRole);
      setLoaded(true);
    }
    loadRole();
  }, []);

  if (!loaded) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[9900] flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white shadow-xl transition-transform hover:scale-105 active:scale-95 border border-white/20 print:hidden"
        aria-label="Abrir guia de ajuda"
      >
        <HelpCircle className="h-6 w-6 text-white" fill="currentColor" stroke="none" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 print:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <HelpGuide role={role} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
