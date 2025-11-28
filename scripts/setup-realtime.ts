import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupRealtime() {
  console.log('Setting up Supabase Realtime configuration...\n');

  // Enable REPLICA IDENTITY FULL for Attendance table
  // This allows postgres_changes to send both old and new values in UPDATE events
  const sql = `
    ALTER TABLE "Attendance" REPLICA IDENTITY FULL;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

    if (error) {
      console.error('Error setting REPLICA IDENTITY:', error);
      console.log('\n⚠️  Please run this SQL manually in your Supabase SQL Editor:');
      console.log('----------------------------------------');
      console.log(sql);
      console.log('----------------------------------------\n');
    } else {
      console.log('✅ REPLICA IDENTITY FULL set for Attendance table');
    }
  } catch (err) {
    console.error('Error executing SQL:', err);
    console.log('\n⚠️  Please run this SQL manually in your Supabase SQL Editor:');
    console.log('----------------------------------------');
    console.log(sql);
    console.log('----------------------------------------\n');
  }

  console.log('\nRealtime setup instructions:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to Database > Replication');
  console.log('3. Enable replication for the "Attendance" table');
  console.log('\nSetup complete!');
}

setupRealtime();
