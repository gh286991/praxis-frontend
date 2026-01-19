'use client';

import React, { useEffect, useRef } from 'react';
import { Loader2, CheckCircle2, XCircle, Terminal } from 'lucide-react';

interface SubmissionProgressModalProps {
  isOpen: boolean;
  messages: string[];
  isLoading: boolean;
}

export function SubmissionProgressModal({ 
  isOpen, 
  messages, 
  isLoading 
}: SubmissionProgressModalProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-lg shadow-[0_0_50px_rgba(99,102,241,0.2)] max-w-2xl w-full overflow-hidden flex flex-col max-h-[70vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <div className="p-2 bg-indigo-500/20 rounded-full">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Processing Submission
            </h2>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
              Please wait while we evaluate your code...
            </p>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-950/30">
          <div className="space-y-2 font-mono text-sm">
            {messages.length === 0 ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Initializing submission...</span>
              </div>
            ) : (
              messages.map((msg, index) => {
                // Parse message type
                const isError = msg.toLowerCase().includes('error');
                const isComplete = msg.toLowerCase().includes('complete') || msg.toLowerCase().includes('passed');
                const isTestCase = msg.toLowerCase().includes('test case');

                // Clean message
                const cleanMsg = msg.replace('[System]', '').trim();

                // Choose icon and styling
                let icon;
                let textColor = 'text-slate-300';
                let bgColor = 'bg-slate-800/50';
                
                if (isError) {
                  icon = <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
                  textColor = 'text-rose-300';
                  bgColor = 'bg-rose-500/10';
                } else if (isComplete) {
                  icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
                  textColor = 'text-emerald-300';
                  bgColor = 'bg-emerald-500/10';
                } else if (isTestCase) {
                  icon = <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />;
                  textColor = 'text-cyan-300';
                  bgColor = 'bg-cyan-500/10';
                } else {
                  icon = <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />;
                  textColor = 'text-indigo-300';
                  bgColor = 'bg-indigo-500/10';
                }

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border border-slate-700/50 ${bgColor} animate-in slide-in-from-left duration-300`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {icon}
                    <span className={`${textColor} flex-1`}>{cleanMsg}</span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span>{isLoading ? 'Processing...' : 'Completed'}</span>
          </div>
          <div className="text-xs text-slate-600 font-mono">
            {messages.length} {messages.length === 1 ? 'update' : 'updates'}
          </div>
        </div>
      </div>
    </div>
  );
}
