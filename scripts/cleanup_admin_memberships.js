/**
 * Cleanup: Remove residual super_admin (soren2222) 'admin' memberships
 * from orgs created via /admin/platform before the bug fix.
 *
 * Usage: node scripts/cleanup_admin_memberships.js
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  // Find super_admin profiles
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_super_admin", true);

  if (pErr) { console.error("Error:", pErr.message); process.exit(1); }
  if (!profiles?.length) { console.log("No super_admin found."); return; }

  console.log(`Super admins: ${profiles.map(p => p.email).join(", ")}`);
  const ids = profiles.map(p => p.id);

  // Find 'admin' memberships for these users
  const { data: mems, error: mErr } = await supabase
    .from("org_memberships")
    .select("id, user_id, org_id, role")
    .in("user_id", ids)
    .eq("role", "admin");

  if (mErr) { console.error("Error:", mErr.message); process.exit(1); }
  if (!mems?.length) { console.log("No residual admin memberships. Clean!"); return; }

  // Get org names
  const orgIds = [...new Set(mems.map(m => m.org_id))];
  const { data: orgs } = await supabase.from("organizations").select("id, name, type").in("id", orgIds);
  const orgMap = new Map((orgs || []).map(o => [o.id, o]));

  console.log(`\nFound ${mems.length} residual membership(s):`);
  for (const m of mems) {
    const org = orgMap.get(m.org_id);
    console.log(`  ${org?.name || m.org_id} (${org?.type}) — role: ${m.role}`);
  }

  // Delete
  const { error: dErr } = await supabase.from("org_memberships").delete().in("id", mems.map(m => m.id));
  if (dErr) { console.error("Delete error:", dErr.message); process.exit(1); }
  console.log(`\n✅ Deleted ${mems.length} residual admin membership(s).`);
}

main().catch(console.error);
