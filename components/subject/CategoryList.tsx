import { List, FileQuestion, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { TerminalWindow } from '@/components/TerminalWindow';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  type?: string;
  duration?: number;
}

interface CategoryListProps {
  subjectSlug: string;
  chapters: Category[];
  exams: Category[];
  onSelectCategory: (slug: string) => void;
}

export function CategoryList({
  subjectSlug,
  chapters,
  exams,
  // onSelectCategory,
}: CategoryListProps) {
  const [activeTab, setActiveTab] = useState<'chapters' | 'exams'>('chapters');

  return (
    <>
      {/* Custom Tabs */}
      <div className="flex space-x-1 mb-6 bg-slate-900/40 p-1 rounded-lg border border-slate-800/50 backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('chapters')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-bold transition-all duration-300',
            activeTab === 'chapters'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          )}
        >
          <List className="w-4 h-4" />
          學習單元 ({chapters.length})
        </button>
        {exams.length > 0 && (
          <button
            onClick={() => setActiveTab('exams')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-bold transition-all duration-300',
              activeTab === 'exams'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-[0_0_15px_-3px_rgba(244,63,94,0.3)]'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            )}
          >
            <FileQuestion className="w-4 h-4" />
            模擬試題 ({exams.length})
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'chapters' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TerminalWindow title={`系統/${subjectSlug.toUpperCase()}/學習單元`}>
              <div className="space-y-4">
                {chapters.length > 0 ? (
                  chapters.map((category, index) => (
                    <Link
                      key={category._id}
                      href={`/exam/${subjectSlug}/${category.slug}`}
                      className="block w-full text-left group relative overflow-hidden bg-slate-900/40 hover:bg-slate-800/60 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 p-4 rounded flex items-center gap-4"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-slate-800 border border-slate-700 rounded flex items-center justify-center text-slate-500 font-mono text-sm group-hover:text-cyan-400 group-hover:border-cyan-500/50 transition-colors">
                        {(index + 1).toString().padStart(2, '0')}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-slate-200 font-bold group-hover:text-cyan-300 transition-colors truncate">
                          {category.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono truncate opacity-60 group-hover:opacity-100 transition-opacity">
                          目錄: /mnt/data/{category.slug}
                        </p>
                      </div>

                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        <span className="text-xs text-cyan-500 font-mono">[ 載入模組 ]</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded">
                    <BookOpen className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <div className="text-slate-600 mb-2">未找到單元模組</div>
                  </div>
                )}
              </div>
            </TerminalWindow>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TerminalWindow title={`系統/${subjectSlug.toUpperCase()}/模擬試題`}>
              <div className="space-y-4">
                {exams.length > 0 ? (
                  exams.map((category, index) => (
                    <Link
                      key={category._id}
                      href={`/exam/${subjectSlug}/${category.slug}`}
                      className="block w-full text-left group relative overflow-hidden bg-rose-950/10 hover:bg-rose-900/20 border border-rose-900/30 hover:border-rose-500/50 transition-all duration-300 p-4 rounded flex items-center gap-4"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-rose-900/20 border border-rose-800/50 rounded flex items-center justify-center text-rose-500 font-mono text-sm group-hover:text-rose-400 group-hover:border-rose-500/50 transition-colors">
                        EX{(index + 1).toString().padStart(2, '0')}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-slate-200 font-bold group-hover:text-rose-300 transition-colors truncate">
                          {category.name}
                        </h3>
                        <div className="flex gap-4 mt-1">
                          <p className="text-xs text-rose-500/60 font-mono truncate group-hover:text-rose-400/80 transition-colors">
                            類型: 模擬試題
                          </p>
                          {category.duration && (
                            <p className="text-xs text-rose-500/60 font-mono truncate group-hover:text-rose-400/80 transition-colors">
                              時間: {category.duration}分鐘
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        <span className="text-xs text-rose-500 font-mono">[ 開始測驗 ]</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-12 border border-dashed border-rose-900/30 rounded bg-rose-950/5">
                    <FileQuestion className="w-8 h-8 text-rose-700 mx-auto mb-2" />
                    <div className="text-rose-600/80 mb-2">尚無模擬試題</div>
                  </div>
                )}
              </div>
            </TerminalWindow>
          </div>
        )}
      </div>
    </>
  );
}
