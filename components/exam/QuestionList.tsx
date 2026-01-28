'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Circle, XCircle, List } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QuestionSummary {
  _id: string;
  title: string;
  generatedBy?: string;
  isAIGenerated?: boolean;
  status?: 'passed' | 'failed' | 'unattempted'; // We might need to fetch this separately or include in list API
}

interface QuestionListProps {
  categorySlug: string;
  currentQuestionId?: string;
  onSelectQuestion?: (id: string) => void;
  initialQuestions?: QuestionSummary[];
  className?: string;
}

export function QuestionList({ categorySlug, currentQuestionId, initialQuestions, onSelectQuestion, className }: QuestionListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<QuestionSummary[]>(initialQuestions || []);
  const [loading, setLoading] = useState(!initialQuestions || initialQuestions.length === 0);

  // Parse current QID from URL if not provided prop
  const activeId = currentQuestionId || searchParams.get('q');

  useEffect(() => {
    // If we have initialQuestions, skip fetch unless categorySlug changes (and initialQuestions doesn't match? - simplified for now)
    if (initialQuestions && initialQuestions.length > 0) {
        setQuestions(initialQuestions);
        setLoading(false);
        return;
    }

    const fetchList = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<QuestionSummary[]>(`/questions/list/${categorySlug}`);
        setQuestions(res.data);
      } catch (error) {
        console.error('Failed to fetch question list:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [categorySlug, initialQuestions]);

  const handleSelect = (id: string) => {
    if (onSelectQuestion) {
      onSelectQuestion(id);
    } else {
        // Default behavior: push to URL
        const params = new URLSearchParams(searchParams.toString());
        params.set('q', id);
        router.push(`?${params.toString()}`);
    }
  };

  if (loading) {
      return <div className="p-4 text-xs text-slate-500 animate-pulse">Loading list...</div>;
  }

  if (questions.length === 0) return null;

  return (
    <div className={cn("flex flex-col h-full bg-slate-900 border-r border-slate-700 flex-shrink-0", className)}>
      <div className="p-4 border-b border-slate-700 flex items-center gap-2">
        <List className="w-4 h-4 text-indigo-400" />
        <h3 className="font-bold text-slate-200 text-sm tracking-wider">QUESTIONS</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {questions.map((q, idx) => {
            const isActive = activeId === q._id;
            // Infer simple Q number from title if possible, or just use index
            const displayTitle = q.title.length > 20 ? `Q${idx + 1}` : q.title;

            return (
              <button
                key={q._id}
                onClick={() => handleSelect(q._id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded text-xs font-mono transition-colors flex items-center gap-2 group",
                  isActive 
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                )}
              >
                 <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", isActive ? "bg-indigo-400" : "bg-slate-600")} />
                 <span className="truncate flex-1">{displayTitle}</span>
                 {/* Status indicator placeholders - would need real status data */}
                 {/* <CheckCircle className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-50" /> */}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
