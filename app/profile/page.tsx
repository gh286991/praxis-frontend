'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/store';
import { getAllStats } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Cpu, Shield, Activity, Share2, Clock } from 'lucide-react';
import { CyberpunkBackground } from '@/components/CyberpunkBackground';
import { TerminalWindow } from '@/components/TerminalWindow';
import { Footer } from '@/components/landing/Footer';
import { AppNavbar } from '@/components/AppNavbar';

interface SubjectStat {
  subjectTitle: string;
  subjectSlug: string;
  totalAttempts: number;
  passedCount: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { profile: user, isAuthenticated } = useAppSelector((state) => state.user);
  const [stats, setStats] = useState<SubjectStat[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
      loadProfile();
    } else {
        setLoading(false);
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      const data = await getAllStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api'}/users/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt_token')}`,
        },
      });
      const data = await response.json();
      setProfileData(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push('/courses');
    }
  };

  // Calculate aggregates with proper fallbacks
  // Use profile data if available, otherwise calculate from stats
  const totalAttempts = profileData?.totalQuestionsCompleted || stats.reduce((acc, curr) => acc + (curr.totalAttempts || 0), 0);
  const totalPassed = profileData?.totalQuestionsPassed || stats.reduce((acc, curr) => acc + (curr.passedCount || 0), 0);
  const overallPassRate = totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : 0;

  if (!isAuthenticated && !loading) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-mono relative overflow-hidden flex flex-col items-center justify-center">
        <CyberpunkBackground />
        <div className="relative z-20 text-center space-y-4">
          <p className="text-red-400 font-bold border border-red-500/50 bg-red-900/20 px-4 py-2 rounded animate-pulse">
             ⚠ ACCESS DENIED: AUTHENTICATION REQUIRED
          </p>
          <Link href="/login" className="inline-block text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-dashed">
            [ INITIALIZE LOGIN SEQUENCE ]
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono selection:bg-indigo-500/30 relative overflow-hidden flex flex-col">
      <CyberpunkBackground />
      
      <AppNavbar />

      <main className="flex-1 p-4 md:p-8 relative z-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Breadcrumb / Back Navigation */}
            <div className="flex items-center gap-2">
                <button 
                  onClick={handleBack}
                  className="group flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold tracking-widest uppercase">[ RETURN_PREVIOUS ]</span>
                </button>
            </div>

            <TerminalWindow title="USER_PROFILE_DATABASE // V.2.4.1">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    
                    {/* Left Column: User Identity Card */}
                    <div className="md:col-span-4 space-y-6">
                        <div className="bg-slate-900/50 border border-slate-700 p-6 rounded-lg relative overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           
                           {/* Avatar Placeholder / Visual */}
                           <div className="w-full aspect-square bg-slate-800 rounded mb-6 flex items-center justify-center relative overflow-hidden border border-slate-600">
                                {user?.picture ? (
                                    <Image src={user.picture} alt={user.name} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <div className="text-6xl font-black text-slate-700 select-none">ID</div>
                                )}
                                {/* Scanline overlay */}
                                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
                                <div className="absolute bottom-2 right-2 text-[10px] text-cyan-500 font-bold bg-black/60 px-1">Img_Ref: {user?.name?.substring(0,3).toUpperCase()}_01</div>
                           </div>

                           <div className="space-y-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">{user?.name}</h2>
                                    <div className="text-xs text-slate-400 font-mono break-all">{user?.email}</div>
                                </div>
                                
                                <div className="space-y-2 pt-4 border-t border-slate-700/50">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">STATUS</span>
                                        <span className="text-emerald-400 font-bold flex items-center gap-2">
                                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                            ONLINE
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">ACCESS_LEVEL</span>
                                        <span className="text-indigo-400 font-bold">DEVELOPER</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">JOINED</span>
                                        <span className="text-slate-300">2024.Q1</span>
                                    </div>
                                </div>
                           </div>
                        </div>

                        {/* System Actions */}
                         <div className="grid grid-cols-2 gap-2">
                            <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3 rounded flex items-center justify-center gap-2 text-xs font-bold text-slate-300 transition-colors">
                                <Share2 className="w-3 h-3" />
                                EXPORT_DATA
                            </button>
                            <button className="bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 p-3 rounded flex items-center justify-center gap-2 text-xs font-bold text-red-400 transition-colors">
                                <Activity className="w-3 h-3" />
                                LOGOUT
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Stats & Data */}
                    <div className="md:col-span-8 space-y-8">
                        
                        {/* Diagnostics Panel */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-cyan-400 mb-2">
                                <Cpu className="w-4 h-4" />
                                <h3 className="text-sm font-bold tracking-widest uppercase">PERFORMANCE_METRICS</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-slate-900/50 border border-slate-700 p-4 rounded group hover:border-cyan-500/50 transition-colors">
                                    <div className="text-[10px] text-slate-500 uppercase mb-1">Total_Ops</div>
                                    <div className="text-2xl font-light text-white group-hover:text-cyan-400 transition-colors">{totalAttempts}</div>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-700 p-4 rounded group hover:border-emerald-500/50 transition-colors">
                                    <div className="text-[10px] text-slate-500 uppercase mb-1">Success_Count</div>
                                    <div className="text-2xl font-light text-emerald-400">{totalPassed}</div>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-700 p-4 rounded group hover:border-yellow-500/50 transition-colors">
                                    <div className="text-[10px] text-slate-500 uppercase mb-1">Failed_Ops</div>
                                    <div className="text-2xl font-light text-yellow-400">{totalAttempts - totalPassed}</div>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-700 p-4 rounded group hover:border-indigo-500/50 transition-colors">
                                    <div className="text-[10px] text-slate-500 uppercase mb-1">Efficiency</div>
                                    <div className="text-2xl font-light text-indigo-400">{overallPassRate}%</div>
                                </div>
                            </div>
                        </div>

                        {/* Subject Breakdown */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-indigo-400 mb-2 border-b border-white/10 pb-2">
                                <Shield className="w-4 h-4" />
                                <h3 className="text-sm font-bold tracking-widest uppercase">MODULE_BREAKDOWN</h3>
                            </div>

                            {stats.length > 0 ? (
                                <div className="space-y-3">
                                    {stats.map((stat, idx) => {
                                        const passRate = stat.totalAttempts > 0 
                                            ? Math.round((stat.passedCount / stat.totalAttempts) * 100) 
                                            : 0;
                                        
                                        return (
                                            <Link 
                                                key={stat.subjectSlug}
                                                href={`/subject/${stat.subjectSlug}`}
                                                className="block bg-slate-900/30 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 rounded p-4 transition-all group"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-mono text-slate-600">0{idx + 1}</span>
                                                        <span className="font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                                                            {stat.subjectTitle}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-mono text-slate-400">
                                                        {stat.passedCount}/{stat.totalAttempts} [{passRate}%]
                                                    </span>
                                                </div>
                                                
                                                {/* Progress Bar */}
                                                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-cyan-600 to-indigo-600 group-hover:from-cyan-400 group-hover:to-indigo-400 transition-all"
                                                        style={{ width: `${passRate}%` }}
                                                    />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 border border-dashed border-slate-800 rounded">
                                    <div className="text-slate-600 mb-2">NO DATA MODULES FOUND</div>
                                    <Link href="/courses" className="text-xs text-cyan-500 hover:text-cyan-400 uppercase tracking-widest">
                                        [ INITIATE_FIRST_EXERCISE ]
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Activity Log Placeholder */}
                         <div className="space-y-4 opacity-50 pointer-events-none grayscale">
                            <div className="flex items-center gap-2 text-slate-400 mb-2 border-b border-white/5 pb-2">
                                <Clock className="w-4 h-4" />
                                <h3 className="text-sm font-bold tracking-widest uppercase">RECENT_ACTIVITY_LOG</h3>
                            </div>
                            <div className="text-xs font-mono text-slate-600 space-y-1">
                                <div>[2024-03-20 14:02:11] SYSTEM_LOGIN_SUCCESS</div>
                                <div>[2024-03-19 09:45:22] MODULE_05_COMPLETE :: SCORE_ACHIEVED</div>
                                <div>[2024-03-18 22:10:05] DATA_SYNC_INITIATED... OK</div>
                            </div>
                        </div>

                    </div>
                </div>
            </TerminalWindow>
        </div>
      </main>
      <Footer />
    </div>
  );
}
