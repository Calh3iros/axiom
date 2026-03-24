require('dotenv').config({path:'.env.local'});
const {createClient}=require('@supabase/supabase-js');
const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async()=>{
  try {
    const {data:orgs} = await c.from('organizations').select('id').in('name',['Escola Teste F4', 'Rede Teste F4']);
    for (const org of (orgs || [])) {
      const orgId = org.id;

      const {data:classes} = await c.from('classes').select('id').eq('org_id', orgId);
      for (const cls of (classes || [])) {
        await c.from('class_memberships').delete().eq('class_id', cls.id);
      }

      await c.from('org_memberships').delete().eq('org_id', orgId);
      await c.from('classes').delete().eq('org_id', orgId);
      await c.from('invite_codes').delete().eq('org_id', orgId);
      await c.from('organizations').delete().eq('id', orgId);
    }

    const {data:users}=await c.auth.admin.listUsers();
    for (const u of users.users) {
      if (u.email === 'admin_test_f4@test.com') {
        await c.from('profiles').delete().eq('id', u.id);
        await c.auth.admin.deleteUser(u.id);
      }
    }

    console.log('Cleanup Done for F4 UI tests.');
  } catch(e) {
    console.error('ERROR:', e);
  }
})();
