require('dotenv').config({path:'.env.local'});
const {createClient}=require('@supabase/supabase-js');
const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async()=>{
  // Get calh3iros
  const {data:users}=await c.auth.admin.listUsers();
  const calhUser = users.users.find(u => u.email === 'calh3iros@yahoo.com');
  const calhId = calhUser ? calhUser.id : (await c.from('profiles').select('id').eq('email', 'calh3iros@yahoo.com').single()).data.id;

  // 1. Crete org
  const {data:org}=await c.from('organizations').insert({name:'MockOrg', type:'School', created_by: calhId}).select('id').single();
  // Add calh3iros as coordinator
  await c.from('org_memberships').insert({org_id: org.id, user_id: calhId, role: 'coordinator'});

  // 2. Create class
  const {data:cls}=await c.from('classes').insert({org_id:org.id, name:'6o A Bug', teacher_id: calhId}).select('id').single();

  // 3. Create fake user directly in class_memberships
  // Can we just insert a random UUID into class_memberships without auth user? 
  // No, auth.users FK requires the user to exist if it points to auth.users, or if it points to profiles.
  let fUserId = '00000000-0000-0000-0000-000000000001';
  let {error:eCreate} = await c.auth.admin.createUser({email:'fakeuser123@ax.com', password:'password'});
  const fakeUser = (await c.auth.admin.listUsers()).users.find(u => u.email === 'fakeuser123@ax.com');
  if (fakeUser) fUserId = fakeUser.id;

  // Insert to class_memberships
  const {error:e4} = await c.from('class_memberships').insert({class_id:cls.id, user_id: fUserId});
  if(e4) console.error('insert err:', e4);
  else console.log('Fake student inserted correctly. class_id:', cls.id);

  // 4. Test query as in code
  const {data:students, error}=await c.from('class_memberships')
    .select('user_id, joined_at, profiles:user_id(full_name, avatar_url, email)')
    .eq('class_id', cls.id)
    .order('joined_at');
    
  console.log('Class Dashboard Query:', students);
  if (error) console.log('error query:', error);

  // Test query profile relationship
  const {data:s2, error:e2}=await c.from('class_memberships')
    .select('user_id, joined_at, profiles(full_name, avatar_url, email)')
    .eq('class_id', cls.id);
  console.log('Query with profiles(full_name...):', s2);
  if (e2) console.log('error query2:', e2);
  
})();
