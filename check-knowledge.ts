import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseAdminKey || supabaseKey);

async function main() {
  const { data, error } = await supabase.from('knowledge_map').select('*');
  if (error) {
    console.error('Error fetching knowledge map:', error);
  } else {
    console.log('Knowledge Map Entries:');
    console.log(JSON.stringify(data, null, 2));
  }
}
main();
