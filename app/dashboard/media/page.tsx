import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard, PixelButton } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { Image as ImageIcon, Upload } from 'lucide-react';

const navItems = [
  { href: '/dashboard/media', label: 'Gallery', icon: 'Image' },
];

export default async function MediaDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'MEDIA') redirect('/login');

  // Mock data for now as upload logic needs storage setup
  const mediaItems = await prisma.media.findMany({
      orderBy: { createdAt: 'desc' }
  });

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">MEDIA GALLERY</h1>
        <p className="text-slate-400">Documentation and memories</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {mediaItems.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-500 bg-slate-900 border-2 border-dashed border-slate-700">
                      No media uploaded yet.
                  </div>
              ) : (
                  mediaItems.map(item => (
                      <PixelCard key={item.id} className="p-0 overflow-hidden">
                          <div className="bg-slate-800 h-48 flex items-center justify-center">
                              <ImageIcon size={48} className="text-slate-600" />
                              {/* <img src={getFileUrl('media', item.storagePath)} /> */}
                          </div>
                          <div className="p-4">
                              <h3 className="font-bold text-white">{item.title}</h3>
                              <p className="text-xs text-slate-400">{item.year}</p>
                          </div>
                      </PixelCard>
                  ))
              )}
          </div>

          <div>
              <PixelCard title="UPLOAD MEDIA">
                  <div className="space-y-4">
                      <div className="border-2 border-dashed border-slate-600 p-8 text-center hover:bg-slate-800 cursor-pointer transition-colors">
                          <Upload className="mx-auto mb-2 text-slate-400" />
                          <p className="text-xs text-slate-400">Drag & Drop or Click to Upload</p>
                      </div>
                      <input type="text" placeholder="Title" className="w-full bg-slate-900 border border-slate-600 p-2" />
                      <input type="text" placeholder="Year/Angkatan" className="w-full bg-slate-900 border border-slate-600 p-2" />
                      <PixelButton variant="primary" className="w-full">UPLOAD</PixelButton>
                  </div>
              </PixelCard>
          </div>
      </div>
    </DashboardLayout>
  );
}
