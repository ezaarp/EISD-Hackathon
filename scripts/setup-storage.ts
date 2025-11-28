
import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('Ensure these are defined in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKETS = [
  { name: 'materials', public: true },
  { name: 'evidence', public: false }, // Private for submissions
  { name: 'media', public: true },
  { name: 'violations', public: false },
  { name: 'permissions', public: false }
];

async function setupStorage() {
  console.log('Checking storage buckets...');

  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('Error listing buckets:', listError);
    // Check if error is auth related
    if (listError.message?.includes('JWT')) {
        console.error('Check your SUPABASE_SERVICE_ROLE_KEY.');
    }
    return;
  }

  const existingNames = existingBuckets.map(b => b.name);

  for (const bucket of BUCKETS) {
    if (existingNames.includes(bucket.name)) {
      console.log(`Bucket '${bucket.name}' already exists.`);
    } else {
      console.log(`Creating bucket '${bucket.name}' (public: ${bucket.public})...`);
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: 52428800, // 50MB
      });

      if (error) {
        console.error(`Error creating bucket '${bucket.name}':`, error);
      } else {
        console.log(`Bucket '${bucket.name}' created successfully.`);
      }
    }
  }

  console.log('Storage setup complete.');
}

setupStorage();
