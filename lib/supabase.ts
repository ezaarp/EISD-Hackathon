import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client with service role (for admin operations)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Helper untuk upload file
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Buffer,
  options?: {
    contentType?: string;
    cacheControl?: string;
    upsert?: boolean;
  }
) {
  const client = supabaseAdmin || supabase;
  const { data, error } = await client.storage.from(bucket).upload(path, file, {
    contentType: options?.contentType,
    cacheControl: options?.cacheControl || '3600',
    upsert: options?.upsert || false,
  });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: urlData } = client.storage.from(bucket).getPublicUrl(path);

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
  };
}

// Helper untuk delete file
export async function deleteFile(bucket: string, path: string) {
  const client = supabaseAdmin || supabase;
  const { error } = await client.storage.from(bucket).remove([path]);

  if (error) {
    throw error;
  }

  return true;
}

// Helper untuk download file URL
export function getFileUrl(bucket: string, path: string) {
  // Private buckets (evidence, violations, permissions) need signed URLs
  const privateBuckets = ['evidence', 'violations', 'permissions'];

  if (privateBuckets.includes(bucket)) {
    // For private buckets, we need to generate signed URLs on the server
    // This function will return a path that will be handled by an API route
    return `/api/files/${bucket}/${encodeURIComponent(path)}`;
  }

  // For public buckets, use public URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export default supabase;
