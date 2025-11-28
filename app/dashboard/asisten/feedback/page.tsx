import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { PixelCard } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { Star, MessageSquare, Calendar } from 'lucide-react';

export default async function AsistenFeedbackPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ASISTEN') {
    redirect('/login');
  }

  // Fetch feedback ratings for this assistant
  const feedbacks = await prisma.rating.findMany({
    where: {
      targetId: session.user.id,
    },
    include: {
      student: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Calculate average rating
  const avgRating = feedbacks.length > 0 
    ? (feedbacks.reduce((sum, f) => sum + f.stars, 0) / feedbacks.length).toFixed(1)
    : 'N/A';

  const navItems = [
    { href: '/dashboard/asisten', label: 'Dashboard', icon: 'Home' },
    { href: '/dashboard/asisten/students', label: 'Students', icon: 'Users' },
    { href: '/dashboard/asisten/grading', label: 'Grading', icon: 'Award' },
    { href: '/dashboard/asisten/feedback', label: 'Feedback', icon: 'MessageSquare' },
  ];

  return (
    <DashboardLayout user={session.user} navItems={navItems}>
      <div className="mb-8">
        <h1 className="text-3xl font-pixel text-white mb-2">STUDENT FEEDBACK</h1>
        <p className="text-slate-400">View ratings and comments from your students</p>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <PixelCard title="AVERAGE RATING">
          <div className="text-center py-4">
            <div className="text-5xl font-pixel text-emerald-400 mb-2">{avgRating}</div>
            <div className="flex justify-center gap-1">
              {[1,2,3,4,5].map(i => (
                <Star 
                  key={i} 
                  size={20} 
                  className={i <= parseFloat(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} 
                />
              ))}
            </div>
          </div>
        </PixelCard>

        <PixelCard title="TOTAL FEEDBACKS">
          <div className="text-center py-4">
            <div className="text-5xl font-pixel text-indigo-400">{feedbacks.length}</div>
            <p className="text-slate-400 text-sm mt-2">Responses received</p>
          </div>
        </PixelCard>

        <PixelCard title="WITH COMMENTS">
          <div className="text-center py-4">
            <div className="text-5xl font-pixel text-cyan-400">
              {feedbacks.filter(f => f.comment).length}
            </div>
            <p className="text-slate-400 text-sm mt-2">Detailed feedback</p>
          </div>
        </PixelCard>
      </div>

      {/* Feedback List */}
      <PixelCard title="FEEDBACK DETAILS">
        {feedbacks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <p>No feedback received yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div 
                key={feedback.id} 
                className="bg-slate-800 border border-slate-700 p-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-white">{feedback.student.name}</p>
                    <p className="text-xs text-slate-500">{feedback.student.username}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map(i => (
                        <Star 
                          key={i} 
                          size={14} 
                          className={i <= feedback.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} 
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                      <Calendar size={12} />
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-indigo-400 mb-2">
                  Feedback from live session
                </div>

                {feedback.comment && (
                  <div className="bg-slate-900 border border-slate-700 p-3 mt-3">
                    <p className="text-sm text-slate-300">&quot;{feedback.comment}&quot;</p>
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

