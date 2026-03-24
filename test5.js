require('dotenv').config({path:'.env.local'});
const {createClient}=require('@supabase/supabase-js');
const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async()=>{
  const {data, error} = await c.from('org_memberships')
    .select('user_id, profiles:user_id(full_name, email)')
    .limit(1);
    
  console.log('Error org_memberships?', error);
})();
