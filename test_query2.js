require('dotenv').config({path:'.env.local'});
const {createClient}=require('@supabase/supabase-js');
const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async()=>{
  // 1. Create a dummy org
  const {data:org, error: e1}=await c.from('organizations').insert({name:'MockOrg', type:'School'}).select('id').single();
  if(e1) return console.log('Err1', e1);

  // 2. Create a dummy class
  const {data:cls, error: e2}=await c.from('classes').insert({org_id:org.id, name:'6o AT'}).select('id').single();
  if(e2) return console.log('Err2', e2);

  const email = `test-${Date.now()}@example.com`;
  const {data:u, error: e3}=await c.auth.admin.createUser({email, password:'password', email_confirm:true});
  if(e3) return console.log('Err3', e3);
  
  const userId = u.user.id;
  console.log('Fake user created:', userId);

  // Instead of letting the trigger do it, let's DELIBERATELY delete the profile to simulate "no profile"
  // or see if the trigger creates it.
  const {data:profile}=await c.from('profiles').select('*').eq('id', userId).single();
  console.log('Profile created by trigger?', !!profile);

  // Insert into class_memberships
  // NOTE: do we need a role='student' ? The UI might not filter by role, but let's see.
  // The table 'class_memberships' has user_id, class_id, joined_at.
  // Wait, does class_memberships have a role column?
  const {error: e4} = await c.from('class_memberships').insert({class_id:cls.id, user_id:userId});
  if(e4) console.log('Err4', e4);

  // 5. Query
  const {data:students, error}=await c.from('class_memberships')
    .select('user_id, joined_at, profiles:user_id(full_name, avatar_url, email)')
    .eq('class_id', cls.id)
    .order('joined_at');
    
  console.log('Query without inner join length:', students ? students.length : 0);
  console.log('Error?', error);
  console.log('Students:', JSON.stringify(students, null, 2));

  // cleanup
  await c.from('class_memberships').delete().eq('class_id', cls.id);
  await c.from('profiles').delete().eq('id', userId);
  await c.auth.admin.deleteUser(userId);
  await c.from('classes').delete().eq('id', cls.id);
  await c.from('organizations').delete().eq('id', org.id);
})();
