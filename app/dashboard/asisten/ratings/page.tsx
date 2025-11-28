import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard } from '@/components/ui';
import prisma from '@/lib/prisma';

const navItems = [
  { href: '/dashboard/asisten', label: 'Dashboard', icon: 'Home' },
  { href: '/dashboard/asisten/students', label: 'Students', icon: 'Users' },
  { href: '/dashboard/asisten/grading', label: 'Grading', icon: 'FileText' },
  { href: '/dashboard/asisten/ratings', label: 'Ratings', icon: 'Award' },
];

export default async function RatingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ASISTEN') {
    redirect('/login');
  }

  // Fetch ratings for this asisten
  const ratings = await prisma.rating.findMany({
    where: {
      type: 'ASISTEN',
      targetId: session.user.id,
    },
    include: {
      student: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
      : 0;

  const ratingsByScore = {
    5: ratings.filter((r) => r.stars === 5).length,
    4: ratings.filter((r) => r.stars === 4).length,
    3: ratings.filter((r) => r.stars === 3).length,
    2: ratings.filter((r) => r.stars === 2).length,
    1: ratings.filter((r) => r.stars === 1).length,
  };

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">MY RATINGS</h1>
        <p className="text-slate-400">Student feedback and performance ratings</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <PixelCard title="AVERAGE RATING">
          <div className="text-center py-8">
            <p className="text-6xl font-bold text-yellow-400 mb-2">
              {avgRating.toFixed(1)}
            </p>
            <p className="text-slate-400">out of 5.0</p>
            <p className="text-sm text-slate-500 mt-2">
              Based on {ratings.length} rating{ratings.length !== 1 ? 's' : ''}
            </p>
          </div>
        </PixelCard>

        <PixelCard title="RATING DISTRIBUTION">
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((score) => {
              const count = ratingsByScore[score as keyof typeof ratingsByScore];
              const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;

              return (
                <div key={score} className="flex items-center gap-3">
                  <span className="text-yellow-400 font-bold w-8">{score}★</span>
                  <div className="flex-1 bg-slate-800 h-6 pixel-border">
                    <div
                      className="bg-yellow-500 h-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-slate-400 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </PixelCard>
      </div>

      {/* Recent Ratings */}
      <PixelCard title={`ALL RATINGS (${ratings.length})`}>
        {ratings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">No ratings yet</p>
            <p className="text-xs text-slate-600">
              Ratings will appear here after students complete their sessions
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.map((rating) => (
              <div
                key={rating.id}
                className="border-b border-slate-800 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-yellow-400 font-bold text-lg">
                        {'★'.repeat(rating.stars)}
                        <span className="text-slate-700">{'★'.repeat(5 - rating.stars)}</span>
                      </span>
                      <span className="text-slate-400 text-sm">
                        {rating.stars}.0 / 5.0
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {rating.student.name} ({rating.student.username})
                    </p>
                  </div>
                  <p className="text-xs text-slate-600">
                    {new Date(rating.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {rating.comment && (
                  <div className="bg-slate-800/50 p-3 pixel-border mt-2">
                    <p className="text-sm text-slate-300">{rating.comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </PixelCard>
    </DashboardLayout>
  );
}
