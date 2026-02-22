import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sparkles, Brain, Award, Target, Hash } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Knowledge Map | Axiom',
  description: 'Track your learning progress and mastery across subjects.',
};

export default async function KnowledgeMapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch all knowledge map entries for this user
  const { data: topics, error } = await supabase
    .from('knowledge_map')
    .select('*')
    .eq('user_id', user.id)
    .order('subject', { ascending: true })
    .order('mastery_score', { ascending: false });

  if (error) {
    console.error('Failed to load knowledge map:', error);
  }

  const topicList = (topics as any[]) || [];

  // Group by subject
  const groupedList = topicList.reduce((acc, curr) => {
    if (!acc[curr.subject]) acc[curr.subject] = [];
    acc[curr.subject].push(curr);
    return acc;
  }, {} as Record<string, typeof topicList>);

  return (
    <div className="h-full flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-3">
          <Brain className="w-8 h-8 text-[var(--color-ax-blue)]" />
          Your Knowledge Map
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-2 max-w-xl">
          Axiom tracks the subjects you query and estimates your mastery. The more you explore and solve, the smarter this map gets.
        </p>
      </div>

      {topicList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[var(--color-bg1)] border border-[var(--color-border2)] rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-[var(--color-bg2)] border border-[var(--color-border)] flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-[var(--color-ax-blue)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">No data yet</h2>
          <p className="text-[var(--color-text-secondary)] max-w-md mb-6">
            Start solving problems in the Chat to build your customized knowledge profile.
          </p>
          <Link
            href="/solve"
            className="px-6 py-2.5 bg-[var(--color-ax-blue)] text-black font-semibold rounded-full hover:bg-blue-400 transition-colors"
          >
            Start Solving
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(groupedList).map(([subject, items]) => (
            <div key={subject} className="bg-[var(--color-bg1)] border border-[var(--color-border2)] rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <Hash className="w-5 h-5 text-[var(--color-ax-blue)]" />
                {subject}
              </h2>
              <div className="space-y-4">
                {items.map((item) => {
                  const percent = Math.round((item.mastery_score || 0) * 100);
                  // Determine color based on mastery
                  let colorClass = 'bg-red-400';
                  let textColor = 'text-red-400';
                  if (percent >= 40) { colorClass = 'bg-yellow-400'; textColor = 'text-yellow-400'; }
                  if (percent >= 70) { colorClass = 'bg-emerald-400'; textColor = 'text-emerald-400'; }
                  if (percent >= 90) { colorClass = 'bg-[var(--color-ax-blue)]'; textColor = 'text-[var(--color-ax-blue)]'; }

                  return (
                    <div key={item.id} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                          {item.topic}
                        </span>
                        <div className="flex items-center gap-2">
                          {percent >= 90 && <Award className="w-4 h-4 text-[var(--color-ax-blue)]" />}
                          <span className={`text-xs font-bold ${textColor}`}>
                            {percent}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-[var(--color-bg2)] rounded-full overflow-hidden border border-[var(--color-border)]">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`}
                          style={{ width: `${Math.max(2, percent)}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span className="text-[10px] text-[var(--color-dim)]">
                          {item.interactions_count} interaction{item.interactions_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
