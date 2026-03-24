require('dotenv').config({path:'.env.local'});
const {createClient}=require('@supabase/supabase-js');
const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async()=>{
  try {
    const {data:users}=await c.auth.admin.listUsers();
    let calhId = (users.users.find(u => u.email === 'calh3iros@yahoo.com') || {}).id;
    if(!calhId) calhId = (await c.from('profiles').select('id').eq('email', 'calh3iros@yahoo.com').single()).data?.id;
    
    let sorenId = undefined;
    const {data:sp} = await c.from('profiles').select('id, email').ilike('email', 'soren%').limit(1);
    if (sp && sp.length > 0) sorenId = sp[0].id;
    
    if(!sorenId) {
      const {data:s, error} = await c.auth.admin.createUser({email:'soren2222@test.com', password:'password'});
      if (error) throw error;
      sorenId = s.user.id;
      // Ensure profile exists for soren
      const {data:p} = await c.from('profiles').select('id').eq('id', sorenId).single();
      if (!p) await c.from('profiles').insert({id: sorenId, email: 'soren2222@test.com', full_name: 'Soren Teacher'});
    }

    // 1. Create org
    const {data:org, error:e1} = await c.from('organizations').insert({name:'Escola Director Test', type:'school', created_by: calhId, status: 'active'}).select('id').single();
    if(e1) throw e1;
    console.log('Org:', org.id);

    // 2. Add calh3iros as director
    await c.from('org_memberships').insert({org_id: org.id, user_id: calhId, role: 'director'});

    // 3. Create 2 classes
    const {data:c1} = await c.from('classes').insert({org_id:org.id, name:'6o A', teacher_id: calhId}).select('id').single();
    const {data:c2} = await c.from('classes').insert({org_id:org.id, name:'7o B', teacher_id: calhId}).select('id').single();

    // 4. Create PRF-DTEST1 code
    await c.from('invite_codes').insert({org_id: org.id, code: 'PRF-DTEST1', role: 'teacher', max_uses: 10, expires_at: new Date(Date.now()+86400000).toISOString()});

    // 5. Add soren2222 as teacher
    await c.from('org_memberships').insert({org_id: org.id, user_id: sorenId, role: 'teacher', subjects: ['Matematica']});

    // 6. Add fake students
    const {data:s1} = await c.auth.admin.createUser({email:`s1_${Date.now()}@test.com`, password:'password'});
    const {data:s2} = await c.auth.admin.createUser({email:`s2_${Date.now()}@test.com`, password:'password'});
    
    // Fix: Wait a second for trigger, or manually create profile
    await new Promise(r => setTimeout(r, 1000));
    await c.from('profiles').upsert([{id: s1.user.id, full_name: 'Student One', email: s1.user.email}, {id: s2.user.id, full_name: 'Student Two', email: s2.user.email}]);

    await c.from('class_memberships').insert([{class_id: c1.id, user_id: s1.user.id}, {class_id: c2.id, user_id: s2.user.id}]);
    await c.from('org_memberships').insert([{org_id: org.id, user_id: s1.user.id, role: 'student'}, {org_id: org.id, user_id: s2.user.id, role: 'student'}]);

    console.log('SETUP DONE. Org ID:', org.id);
  } catch(e) {
    console.error('ERROR:', e);
  }
})();
