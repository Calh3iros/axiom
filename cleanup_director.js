require('dotenv').config({path:'.env.local'});
const {createClient}=require('@supabase/supabase-js');
const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async()=>{
  try {
    const {data:org} = await c.from('organizations').select('id').eq('name','Escola Director Test').single();
    if (!org) return console.log('No org found, cleanup done.');
    const orgId = org.id;

    const {data:classes} = await c.from('classes').select('id').eq('org_id', orgId);
    for (const cls of (classes || [])) {
      await c.from('class_memberships').delete().eq('class_id', cls.id);
    }
    
    await c.from('org_memberships').delete().eq('org_id', orgId);
    await c.from('classes').delete().eq('org_id', orgId);
    await c.from('invite_codes').delete().eq('org_id', orgId);
    await c.from('organizations').delete().eq('id', orgId);

    const {data:users}=await c.auth.admin.listUsers();
    for (const u of users.users) {
      if (u.email && u.email.includes('@test.com') && u.email.startsWith('s')) {
        await c.from('profiles').delete().eq('id', u.id);
        await c.auth.admin.deleteUser(u.id);
      }
    }

    console.log('Cleanup Done for Escola Director Test.');
  } catch(e) {
    console.error('ERROR:', e);
  }
})();
