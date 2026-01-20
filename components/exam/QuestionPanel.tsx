import { Sparkles, Hash } from 'lucide-react';
import { Question, Tag } from '@/lib/store/slices/questionsSlice';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface QuestionPanelProps {
  question: Question | null;
  loading?: boolean;
}

const getTagColor = (type: string) => {
  switch (type) {
    case 'concept':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'algorithm':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'data_structure':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'language_feature':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
};

const getTagLabel = (type: string) => {
  switch (type) {
    case 'concept': return '概念';
    case 'algorithm': return '演算法';
    case 'data_structure': return '資料結構';
    case 'language_feature': return '語法';
    default: return '標籤';
  }
};

export function QuestionPanel({ question, loading }: QuestionPanelProps) {
  if (loading) {
     return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl blur-2xl opacity-20 animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center border border-slate-700 shadow-2xl">
                    <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse" />
                </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">載入題目中...</h3>
        </div>
     );
  }

  if (!question) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl blur-2xl opacity-20 animate-pulse" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center border border-slate-700 shadow-2xl">
            <Sparkles className="w-12 h-12 text-indigo-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">準備開始練習？</h3>
        <p className="text-slate-400 max-w-sm leading-relaxed text-sm">請選擇題目類別並點擊生成按鈕開始練習。</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider text-indigo-300 uppercase">題目</span>
          </div>

          {/* Tags */}
          {question.tags && question.tags.length > 0 && question.tags.map((tag) => (
             typeof tag === 'object' && tag.name ? (
                <div 
                  key={tag._id} 
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium tracking-wide ${getTagColor(tag.type)}`}
                  title={tag.description || getTagLabel(tag.type)}
                >
                  <Hash className="w-3 h-3 opacity-70" />
                  {tag.name}
                </div>
             ) : null
          ))}
        </div>
        
        <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">{question.title}</h2>
        <div className="prose prose-invert prose-slate max-w-none prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-slate-700/50">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            rehypePlugins={[rehypeHighlight]}
          >
            {question.description}
          </ReactMarkdown>
        </div>
      </div>


      <div className="space-y-4">
        <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-cyan-900/10 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative px-5 py-3 bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-slate-700/50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">範例輸入</h3>
          </div>
          <pre className="relative p-5 font-mono text-sm text-cyan-200 overflow-x-auto">
            {question.sampleInput || <span className="text-slate-600 italic">無需輸入</span>}
          </pre>
        </div>

        <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative px-5 py-3 bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-b border-slate-700/50 flex justify-between items-center">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">範例輸出</h3>
          </div>
          <pre className="relative p-5 font-mono text-sm text-emerald-200 overflow-x-auto">{question.sampleOutput}</pre>
        </div>
      </div>
    </div>
  );
}
