import { Terminal, CheckCircle2, XCircle, List, PlayCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ConsolePanelProps {
  output: string;
  height: number;
  input?: string;
  expectedOutput?: string;
  passed?: boolean; // New prop
  samples?: { input: string; output: string }[];
  results?: {
    input: string;
    output: string;
    expected: string;
    passed: boolean;
  }[];
}

export function ConsolePanel({ output, height, input, expectedOutput, passed, results, samples }: ConsolePanelProps) {
  const [activeTab, setActiveTab] = useState<'terminal' | 'testcases'>('terminal');
  const [selectedCaseIndex, setSelectedCaseIndex] = useState<number>(0);

  // Merge samples and results
  // If we have specific results, use them. 
  // If not, use samples (if available) with pending status.
  // Legacy fallback: input/expectedOutput props.
  const mergedResults = (samples && samples.length > 0)
    ? samples.map((sample, idx) => {
        const result = results && results[idx];
        if (result) {
            return {
                ...result,
                status: result.passed ? 'passed' : 'failed' as const
            };
        }
        return {
            input: sample.input,
            output: '',
            expected: sample.output,
            passed: false, // Default
            status: 'pending' as const
        };
    }) 
    : (results && results.length > 0)
        ? results.map(r => ({ ...r, status: r.passed ? 'passed' : 'failed' as const }))
        : (input !== undefined || expectedOutput !== undefined)
            ? [{
                input: input || '',
                output: output,
                expected: expectedOutput || '',
                passed: passed || false,
                status: (output || passed !== undefined) ? (passed ? 'passed' : 'failed') : 'pending' as const
              }]
            : [];

  // Reset selection when results change (e.g. re-run or new question)
  useEffect(() => {
     // If we have actual run results, try to find the first failure
     if (results && results.length > 0) {
          const firstFailed = results.findIndex(r => !r.passed);
          setSelectedCaseIndex(firstFailed >= 0 ? firstFailed : 0);
     } 
     // If we just loaded samples but no run results yet, stay at 0 or keep current if valid
     else if (samples && samples.length > 0) {
         if (selectedCaseIndex >= samples.length) {
             setSelectedCaseIndex(0);
         }
     }
  }, [results, samples]); // Depend on both

  // Logic to determine what to show in Terminal View
  const displayedResult = mergedResults[selectedCaseIndex];
  
  // Normalized data for Terminal View
  const terminalData = displayedResult ? {
      input: displayedResult.input,
      output: displayedResult.output,
      expected: displayedResult.expected,
      passed: displayedResult.passed,
      status: displayedResult.status
  } : {
      input: input || '',
      output: output,
      expected: expectedOutput || '',
      passed: passed || false,
      status: 'pending' as const
  };

  const handleCaseClick = (index: number) => {
      setSelectedCaseIndex(index);
      setActiveTab('terminal');
  };
  
  const isAllPassed = results && results.length > 0 && results.every(r => r.passed);
  const failureCount = results ? results.filter(r => !r.passed).length : 0;
  const hasRun = results && results.length > 0;

  return (
    <div 
      className="bg-slate-950/90 backdrop-blur-md border-t border-slate-700/50 flex flex-col shadow-2xl flex-shrink-0"
      style={{ height: `${height}px` }}
    >
      {/* Header Bar */}
      <div className="px-5 py-2 bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-between">
        
        {/* Left Side: Tabs */}
        <div className="flex bg-slate-950/50 p-1 rounded-lg border border-slate-800/50">
            <button
                onClick={() => setActiveTab('terminal')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === 'terminal' 
                    ? 'bg-indigo-500/20 text-indigo-300 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
            >
                <Terminal className="w-3.5 h-3.5" />
                Console
            </button>
            {mergedResults.length > 0 && (
                <button
                    onClick={() => setActiveTab('testcases')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                        activeTab === 'testcases' 
                        ? 'bg-indigo-500/20 text-indigo-300 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                    }`}
                >
                    <List className="w-3.5 h-3.5" />
                    Test Cases
                    <span className="ml-1 bg-slate-800 text-slate-400 px-1.5 rounded-full text-[10px] min-w-[1.25rem] text-center">
                        {mergedResults.length}
                    </span>
                </button>
            )}
        </div>

        {/* Center/Right Side: Global Status */}
        <div className="flex items-center gap-3">
             {/* Pass/Fail Indicator (Global) */}
            {hasRun ? (
               <div className="flex gap-2">
                 {isAllPassed ? (
                    <div className="flex items-center gap-2 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                       <CheckCircle2 className="w-3.5 h-3.5" /> <span>All Passed</span>
                    </div>
                 ) : (
                    <div className="flex items-center gap-2 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                       <XCircle className="w-3.5 h-3.5" /> <span>{failureCount} Failed</span>
                    </div>
                 )}
               </div>
            ) : (
                <div className="flex items-center gap-2 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border bg-slate-800/50 text-slate-400 border-slate-700/50">
                    <Clock className="w-3.5 h-3.5" /> <span>Ready to Run</span>
                </div>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 font-mono text-[15px] custom-scrollbar bg-slate-900/50">
        
        {/* View 1: Terminal / Console */}
        {activeTab === 'terminal' && (
            terminalData.expected ? (
              <div className="max-w-4xl mx-auto animate-in fade-in duration-300 font-mono text-sm leading-relaxed">
                
                {/* Minimal Navigation Header */}
                {mergedResults.length > 0 && (
                    <div className="flex items-center justify-between py-2 mb-4 border-b border-slate-800/50">
                         <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">
                            Case {selectedCaseIndex + 1}
                            {terminalData.status === 'passed' && <span className="ml-2 text-emerald-500">PASS</span>}
                            {terminalData.status === 'failed' && <span className="ml-2 text-rose-500">FAIL</span>}
                            {terminalData.status === 'pending' && <span className="ml-2 text-slate-600">PENDING</span>}
                         </span>
                         
                         <div className="flex gap-1.5">
                            {mergedResults.map((r, i) => (
                                <button 
                                    key={i}
                                    onClick={() => setSelectedCaseIndex(i)}
                                    className={`w-1.5 h-1.5 rounded-sm transition-all ${
                                        selectedCaseIndex === i 
                                            ? 'bg-slate-200'
                                            : (r.status === 'passed' ? 'bg-emerald-900/50 hover:bg-emerald-500' : 
                                               r.status === 'failed' ? 'bg-rose-900/50 hover:bg-rose-500' : 'bg-slate-800 hover:bg-slate-600')
                                    }`}
                                    title={`Case ${i+1}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Terminal Content - Unified Stream */}
                <div className="font-mono text-sm space-y-6">
                    
                    {/* Input - Clearly visible */}
                    <div className="group">
                        <div className="flex items-center gap-2 mb-2 select-none">
                            <span className="text-emerald-500 font-bold">➜</span>
                            <span className="text-slate-400 font-bold tracking-wide text-xs">INPUT</span>
                        </div>
                        <div className="text-slate-200 whitespace-pre-wrap pl-5 border-l-2 border-slate-700/50 bg-slate-900/30 py-2 rounded-r">
                            {terminalData.input || <span className="opacity-50 italic">No input</span>}
                        </div>
                    </div>

                    {/* Actual Output */}
                    <div className="group">
                         <div className="flex items-center gap-2 mb-2 select-none">
                            <span className={`font-bold ${
                                terminalData.status === 'passed' ? 'text-emerald-500' : 
                                terminalData.status === 'failed' ? 'text-rose-500' : 'text-indigo-400'
                            }`}>➜</span>
                            <span className={`font-bold tracking-wide text-xs ${
                                terminalData.status === 'passed' ? 'text-emerald-400/80' : 
                                terminalData.status === 'failed' ? 'text-rose-400/80' : 'text-indigo-300/80'
                            }`}>OUTPUT</span>
                         </div>
                         <div className={`whitespace-pre-wrap pl-5 border-l-2 text-base leading-relaxed py-2 ${
                            terminalData.status === 'passed' ? 'border-emerald-500/30 text-emerald-100' : 
                            terminalData.status === 'failed' ? 'border-rose-500/30 text-rose-100' : 
                            'border-indigo-500/30 text-indigo-100'
                        }`}>
                            {terminalData.status === 'pending' ? (
                                <span className="text-slate-500 italic text-sm">Waiting to run...</span>
                            ) : (
                                terminalData.output || <span className="text-slate-600 italic">No output generated</span>
                            )}
                        </div>
                    </div>

                    {/* Expected Output - Comparison (Reference) */}
                    {terminalData.status === 'failed' && (
                        <div className="mt-6 pt-4 border-t border-slate-800/50 border-dashed">
                            <div className="text-slate-500 text-[10px] font-bold tracking-widest mb-1 select-none">EXPECTED</div>
                             <div className="text-slate-400 whitespace-pre-wrap pl-2 border-l border-slate-800">
                                {terminalData.expected}
                             </div>
                        </div>
                    )}
                    
                    {/* If passed, maybe show expected subtly or not at all? User said "important is result". 
                        If passed, detailed expected is redundant if it matches output. 
                        Let's just show it if it's failed, or maybe very subtly if passed. 
                        User: "Important is result they typed".
                        Let's hide expected if passed to keep it cleaner? Or simple "Matches Expected".
                        Let's stick to showing it only if failed or pending (to know what to aim for).
                        If passed, imply Output == Expected.
                    */}
                </div>
              </div>
            ) : (
              <pre className="text-emerald-300 font-semibold leading-relaxed tracking-wide animate-in fade-in">
                {output || <span className="text-slate-600 italic font-normal">等待執行...</span>}
              </pre>
            )
        )}

        {/* View 2: All Test Cases List */}
        {activeTab === 'testcases' && mergedResults.length > 0 && (
            <div className="space-y-3 max-w-5xl mx-auto animate-in fade-in duration-300">
             {mergedResults.map((res, idx) => (
                <div 
                    key={idx} 
                    className={`
                        group border rounded-lg p-4 transition-all
                        ${res.status === 'passed' ? 'bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-500/30' : 
                          res.status === 'failed' ? 'bg-rose-950/10 border-rose-500/20 hover:border-rose-500/30' : 
                          'bg-slate-900/20 border-slate-800 hover:border-slate-700'}
                    `}
                >
                  {/* Header: Status + Case ID */}
                  <div className="flex items-center gap-3 mb-3">
                      <div className={`p-1 rounded-full ${
                          res.status === 'passed' ? 'bg-emerald-500/10 text-emerald-400' : 
                          res.status === 'failed' ? 'bg-rose-500/10 text-rose-400' : 
                          'bg-slate-500/10 text-slate-400'
                      }`}>
                          {res.status === 'passed' ? <CheckCircle2 className="w-4 h-4" /> : 
                           res.status === 'failed' ? <XCircle className="w-4 h-4" /> : 
                           <Clock className="w-4 h-4" />}
                      </div>
                      <span className={`text-sm font-medium ${
                          res.status === 'passed' ? 'text-emerald-100' : 
                          res.status === 'failed' ? 'text-rose-100' : 
                          'text-slate-300'
                      }`}>
                          Test Case {idx + 1}
                      </span>
                  </div>
                  
                  {/* Content Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                      {/* Input */}
                      <div className="space-y-1">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Input</div>
                          <div className="bg-slate-950/50 p-2.5 rounded border border-slate-800/50 text-slate-300 whitespace-pre-wrap min-h-[2.5rem]">
                              {res.input || <span className="text-slate-600 italic">Empty</span>}
                          </div>
                      </div>

                      {/* Actual Output */}
                      <div className="space-y-1">
                          <div className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-wider">Actual Output</div>
                          <div className={`p-2.5 rounded border min-h-[2.5rem] whitespace-pre-wrap ${
                              res.status === 'pending' ? 'bg-slate-950/30 border-slate-800/50 text-slate-600 italic' :
                              res.status === 'passed' ? 'bg-indigo-950/10 border-indigo-500/10 text-indigo-200' :
                              'bg-rose-950/10 border-rose-500/20 text-rose-300'
                          }`}>
                              {res.status === 'pending' ? 'Pending...' : (res.output || <span className="opacity-50">Empty</span>)}
                          </div>
                      </div>

                      {/* Expected Output */}
                      <div className="space-y-1">
                          <div className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider">Expected Output</div>
                          <div className="bg-slate-950/50 p-2.5 rounded border border-slate-800/50 text-slate-300 whitespace-pre-wrap min-h-[2.5rem]">
                              {res.expected || <span className="text-slate-600 italic">Empty</span>}
                          </div>
                      </div>
                  </div>
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
