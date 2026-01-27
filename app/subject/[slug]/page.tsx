'use client';

import { useRef, useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart2, BookOpen, Shield, Cpu, Activity, Upload, Loader2, FileUp } from 'lucide-react';
import { getSubjectBySlug, getCategoriesBySubject, subjectsApi } from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { setCurrentSubject, setCategories, setLoading, fetchSubjectStats, setError } from '@/lib/store/slices/subjectsSlice';
import { Footer } from '@/components/landing/Footer';
import { CyberpunkBackground } from '@/components/CyberpunkBackground';
import { TerminalWindow } from '@/components/TerminalWindow';
import { AppNavbar } from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SubjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { currentSubject: subject, categories, loading, currentSubjectStats } = useAppSelector((state) => state.subjects);

  // Filter categories into chapters and exams
  const chapters = categories.filter(c => !c.type || c.type === 'CHAPTER');
  const exams = categories.filter(c => c.type === 'EXAM');

  useEffect(() => {
    // Token check removed - relying on HttpOnly cookies and middleware
    
    // Set loading true initially if no subject or slug changed
    if (!subject || subject.slug !== slug) {
       dispatch(setLoading(true));
    }

    // Fetch subject, categories, and stats
    const fetchData = async () => {
      try {
        const subjectData = await getSubjectBySlug(slug);
        dispatch(setCurrentSubject(subjectData));
        
        const [categoriesData] = await Promise.all([
          getCategoriesBySubject(subjectData._id),
          dispatch(fetchSubjectStats(slug))
        ]);
        
        dispatch(setCategories(categoriesData));
      } catch (error) {
        console.error(error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchData();
      
  }, [slug, router, dispatch]);

  const handleStartCategory = (categorySlug: string) => {
    router.push(`/exam/${slug}/${categorySlug}`);
  };

  const handleImportMockExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0] || !subject) return;

    const file = fileInputRef.current.files[0];
    setIsImporting(true);

    try {
      await subjectsApi.importMockExam(file, subject._id);
      
      // Refresh categories
      const categoriesData = await getCategoriesBySubject(subject._id);
      dispatch(setCategories(categoriesData));
      setIsImportOpen(false);
      
    } catch (error) {
      console.error(error);
      alert("Failed to import mock exam. Please check the file format.");
    } finally {
      setIsImporting(false);
    }
  };


  if ((loading && !subject) || !subject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 font-mono relative overflow-hidden">
        <CyberpunkBackground />
        <div className="relative z-10 text-center space-y-4">
            <div className="text-cyan-400 font-bold text-xl animate-pulse flex items-center gap-2 justify-center">
                <Activity className="w-5 h-5 animate-spin" />
                <span>INITIALIZING_MODULE_DATA...</span>
            </div>
            <div className="w-64 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-cyan-500 animate-progress" style={{ width: '60%' }} />
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono selection:bg-indigo-500/30 relative overflow-hidden flex flex-col">
        <CyberpunkBackground />

        <AppNavbar />

      {/* Main Content */}
      <main className="relative container mx-auto px-6 py-12 z-20 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6"> 
                    
                    {/* Header / Info Panel */}
                    <div className="lg:col-span-12">
                         <div className="bg-slate-900/80 border border-slate-700/50 p-6 md:p-8 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Shield className="w-32 h-32 text-indigo-500" />
                            </div>
                            
                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
                                    <Cpu className="w-3 h-3" />
                                    Active Module
                                </div>
                                <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-indigo-200 tracking-tight mb-4">
                                    {subject.name}
                                </h1>
                                <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
                                    系統已載入 <span className="text-cyan-400 font-bold">{subject.name}</span> 題庫模組。 
                                    系統已載入 <span className="text-cyan-400 font-bold">{subject.name}</span> 題庫模組。 
                                    目前共有 <span className="text-white font-bold">{chapters.length}</span> 個學習單元
                                    {exams.length > 0 && <span> 及 <span className="text-rose-400 font-bold">{exams.length}</span> 個模擬試題</span>}
                                    可供存取。
                                    請選擇下方單元以啟動練習程序。
                                </p>
                            </div>

                             {/* Import Button absolute positioned */}
                             <div className="absolute bottom-6 right-6 z-20">
                                <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                                    <DialogTrigger asChild>
                                        <Button 
                                            variant="outline" 
                                            className="bg-slate-900/50 border-slate-700/50 hover:bg-indigo-500/20 hover:border-indigo-500/50 text-slate-300 hover:text-white transition-all duration-300 group"
                                        >
                                            <Upload className="w-4 h-4 mr-2 group-hover:text-indigo-400" />
                                            <span className="text-xs font-bold tracking-wider">IMPORT MODULE</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-slate-950 border-slate-800 text-slate-200">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2 text-indigo-400">
                                                <FileUp className="w-5 h-5" />
                                                Import Mock Exam
                                            </DialogTitle>
                                            <DialogDescription className="text-slate-400">
                                                Upload a .zip file containing the mock exam data. This will add a new exam module to the current subject.
                                            </DialogDescription>
                                        </DialogHeader>
                                        
                                        <form onSubmit={handleImportMockExam} className="space-y-6 mt-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="exam-file" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                    Module Archive (.zip)
                                                </Label>
                                                <Input
                                                    id="exam-file"
                                                    type="file"
                                                    accept=".zip,.json"
                                                    ref={fileInputRef}
                                                    className="bg-slate-900 border-slate-800 focus:border-indigo-500/50 file:bg-slate-800 file:text-slate-300 file:border-0 hover:file:bg-slate-700 transition-colors"
                                                    required
                                                />
                                            </div>

                                            <div className="flex justify-end gap-3">
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    onClick={() => setIsImportOpen(false)}
                                                    className="hover:bg-slate-900 text-slate-400 hover:text-white"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    type="submit" 
                                                    disabled={isImporting}
                                                    className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[100px]"
                                                >
                                                    {isImporting ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Importing
                                                        </>
                                                    ) : (
                                                        'Upload'
                                                    )}
                                                </Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                             </div>
                            </div>
                         </div>

                    {/* Left Column: Stats */}
                    <div className="lg:col-span-4 space-y-6">
                        <TerminalWindow title="SYSTEM_DIAGNOSTICS">
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-emerald-400 border-b border-emerald-500/20 pb-2">
                                    <BarChart2 className="w-4 h-4" />
                                    <h3 className="text-xs font-bold tracking-widest uppercase">PROGRESS_METRICS</h3>
                                </div>

                                {currentSubjectStats && currentSubjectStats.completedQuestions > 0 ? (
                                    <div className="space-y-4">
                                        <div className="bg-slate-900/50 p-4 rounded border border-slate-700/50">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-[10px] text-slate-500 uppercase">Completion</span>
                                                <span className="text-xl font-light text-cyan-400">
                                                    {Math.round((currentSubjectStats.completedQuestions / Math.max(currentSubjectStats.totalQuestions, 1)) * 100)}%
                                                </span>
                                            </div>
                                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-cyan-500" 
                                                    style={{ width: `${(currentSubjectStats.completedQuestions / Math.max(currentSubjectStats.totalQuestions, 1)) * 100}%` }} 
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-900/50 p-3 rounded border border-slate-700/50">
                                                <div className="text-[10px] text-slate-500 uppercase mb-1">Solved</div>
                                                <div className="text-lg font-mono text-white">{currentSubjectStats.completedQuestions}</div>
                                            </div>
                                            <div className="bg-slate-900/50 p-3 rounded border border-slate-700/50">
                                                <div className="text-[10px] text-slate-500 uppercase mb-1">Total</div>
                                                <div className="text-lg font-mono text-slate-400">{currentSubjectStats.totalQuestions}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 opacity-50">
                                        <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                        <p className="text-xs text-slate-500">NO_DATA_AVAILABLE</p>
                                    </div>
                                )}
                            </div>
                        </TerminalWindow>
                    </div>

                    {/* Right Column: Categories */}
                    <div className="lg:col-span-8">
                        <TerminalWindow title={`ROOT/${subject.slug.toUpperCase()}/CHAPTERS`}>
                            <div className="space-y-4">
                                {chapters.length > 0 ? (
                                    chapters.map((category, index) => (
                                        <button
                                            key={category._id}
                                            onClick={() => handleStartCategory(category.slug)}
                                            className="w-full text-left group relative overflow-hidden bg-slate-900/40 hover:bg-slate-800/60 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 p-4 rounded flex items-center gap-4"
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
                                                    DIR: /mnt/data/{category.slug}
                                                </p>
                                            </div>

                                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                                <span className="text-xs text-cyan-500 font-mono">[ LOAD_MODULE ]</span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-12 border border-dashed border-slate-800 rounded">
                                        <BookOpen className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                                        <div className="text-slate-600 mb-2">NO CHAPTER MODULES FOUND</div>
                                    </div>
                                )}
                            </div>
                        </TerminalWindow>

                        {/* Mock Exams Section */}
                        {exams.length > 0 && (
                            <div className="mt-8">
                                <TerminalWindow title={`ROOT/${subject.slug.toUpperCase()}/MOCK_EXAMS`}>
                                    <div className="space-y-4">
                                        {exams.map((category, index) => (
                                            <button
                                                key={category._id}
                                                onClick={() => handleStartCategory(category.slug)}
                                                className="w-full text-left group relative overflow-hidden bg-rose-950/10 hover:bg-rose-900/20 border border-rose-900/30 hover:border-rose-500/50 transition-all duration-300 p-4 rounded flex items-center gap-4"
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
                                                            TYPE: MOCK_EXAM
                                                        </p>
                                                        {category.duration && (
                                                            <p className="text-xs text-rose-500/60 font-mono truncate group-hover:text-rose-400/80 transition-colors">
                                                                TIME: {category.duration}MIN
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                                    <span className="text-xs text-rose-500 font-mono">[ START_EXAM ]</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </TerminalWindow>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </main>
        <Footer />
    </div>
  );
}

