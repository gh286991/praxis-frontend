import React from 'react';
import { X, MessageSquare, Send, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Button } from '@/components/ui/button';

interface TutorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chatHistory: { role: 'user' | 'model'; message: string }[];
  onSendChat: (message: string) => void;
  chatLoading: boolean;
}

export function TutorSidebar({
  isOpen,
  onClose,
  chatHistory,
  onSendChat,
  chatLoading
}: TutorSidebarProps) {
  const [inputMessage, setInputMessage] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || chatLoading) return;
    onSendChat(inputMessage);
    setInputMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-[400px] border-l border-slate-700/50 bg-slate-900/95 backdrop-blur-xl flex flex-col h-full animate-in slide-in-from-right duration-300 shadow-2xl z-20">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="font-bold text-slate-100 tracking-wide">AI 程式導師</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-white">
        <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        
            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4" ref={scrollRef}>
                    {chatHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-2 ring-1 ring-white/10">
                                <Bot className="w-8 h-8 text-indigo-400" />
                            </div>
                            
                            <div className="text-center space-y-2 max-w-[280px]">
                                <h3 className="font-bold text-slate-100 text-lg">我能為您做什麼？</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    我可以協助您理解程式邏輯、修正語法錯誤，或是進行除錯。
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 w-full max-w-[300px]">
                                {[
                                    { label: "💡 給我一點提示", msg: "請給我關於這題邏輯的一點提示。" },
                                    { label: "📝 語法教學", msg: "我需要這題相關的 Python 語法幫助。" },
                                    { label: "🐛 幫我除錯", msg: "可以幫我找出目前程式碼中的錯誤嗎？" },
                                    { label: "🧐 解釋題目要求", msg: "請用簡單的方式解釋這題的要求。" }
                                ].map((action, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => onSendChat(action.msg)}
                                        className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 rounded-xl text-left transition-all group"
                                    >
                                        <span className="text-sm text-slate-200 group-hover:text-white font-medium">{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        chatHistory.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-500/20' : 'bg-emerald-500/20'}`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4 text-indigo-400" /> : <Bot className="w-4 h-4 text-emerald-400" />}
                                </div>
                                <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-indigo-600/20 text-indigo-100 rounded-tr-sm' 
                                        : 'bg-slate-800/80 text-slate-300 rounded-tl-sm'
                                }`}>
                                     <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]} 
                                        rehypePlugins={[rehypeHighlight]}
                                        components={{
                                            code({node, inline, className, children, ...props}: any) {
                                                return inline ? (
                                                    <code className="bg-slate-950/50 px-1 py-0.5 rounded text-indigo-300 font-mono text-xs" {...props}>
                                                        {children}
                                                    </code>
                                                ) : (
                                                    <div className="not-prose my-2 bg-slate-950/50 rounded-lg p-2 overflow-x-auto border border-slate-800/50 text-xs">
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    </div>
                                                )
                                            }
                                        }}
                                    >
                                        {msg.message}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))
                    )}
                    {chatLoading && (
                         <div className="flex gap-3">
                             <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                 <Bot className="w-4 h-4 text-emerald-400" />
                             </div>
                             <div className="bg-slate-800/80 rounded-2xl rounded-tl-sm px-4 py-3">
                                 <div className="flex gap-1.5">
                                     <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                                     <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                                     <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                                 </div>
                             </div>
                         </div>
                    )}
                </div>

                <div className="p-4 bg-slate-900/50 border-t border-slate-800/50 space-y-3">
                    {/* Helper Chips */}
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mask-linear">
                        {[
                            { label: "💡 提示", msg: "請給我關於這題邏輯的一點提示。" },
                            { label: "📝 語法", msg: "我需要這題的 Python 語法幫助。" },
                            { label: "🐛 除錯", msg: "幫我檢查程式碼錯誤。" },
                            { label: "🧐 解釋", msg: "請解釋這題的要求。" },
                        ].map((chip, idx) => (
                            <button
                                key={idx}
                                onClick={() => onSendChat(chip.msg)}
                                disabled={chatLoading}
                                className="whitespace-nowrap px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-full text-xs text-indigo-300 transition-colors"
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="輸入訊息..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none h-[50px] custom-scrollbar"
                            disabled={chatLoading}
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || chatLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-2 text-center">
                        AI 可能會犯錯，請查核重要資訊。
                    </p>
                </div>
            </div>
      </div>
    </div>
  );
}
