import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ bucket: string; path: string[] }> }
) {
    const session = await getServerSession(authOptions);

    // Require authentication for private buckets
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const bucket = params.bucket;
    const path = params.path.join('/');
    const decodedPath = decodeURIComponent(path);

    // Generate signed URL valid for 1 hour
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(decodedPath, 3600); // 3600 seconds = 1 hour

    if (error) {
        console.error('Error creating signed URL:', error);
        return NextResponse.json({ error: 'Failed to generate file URL' }, { status: 500 });
    }

    if (!data.signedUrl) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Redirect to the signed URL
    return NextResponse.redirect(data.signedUrl);
}
