require('dotenv').config({path:'.env.local'});
const {createClient}=require('@supabase/supabase-js');
const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
  try {
    const {data:s} = await c.auth.admin.createUser({email:'admin_test_f4@test.com', password:'password', email_confirm: true});
    await new Promise(r => setTimeout(r, 1000));
    await c.from('profiles').upsert({id: s.user.id, full_name: 'Super Admin Test', email: s.user.email, is_super_admin: true});
    console.log('Super Admin created:', s.user.id);
  } catch(e) { console.error(e) }
})();
