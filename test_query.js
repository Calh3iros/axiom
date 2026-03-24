require('dotenv').config({path:'.env.local'});
const {createClient}=require('@supabase/supabase-js');
const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async()=>{
  // find class 6o A
  const {data:cls}=await c.from('classes').select('*').eq('name','6o A').single();
  if(!cls) return console.log('no 6o A class');
  
  const {data:students, error}=await c.from('class_memberships')
    .select('user_id, joined_at, profiles:user_id(full_name, avatar_url, email)')
    .eq('class_id', cls.id)
    .order('joined_at');
    
  console.log('Class 6o A ID:', cls.id);
  console.log('Students count:', students ? students.length : 0);
  console.log('Error?', error);
  console.log('Students data:', students);
  
  // count class_memberships for this class without join
  const {data:raw}=await c.from('class_memberships').select('*').eq('class_id', cls.id);
  console.log('Raw count:', raw ? raw.length : 0);
})();
