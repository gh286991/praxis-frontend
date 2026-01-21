'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Chrome, Loader2, Terminal, Sparkles, Lock, Mail } from 'lucide-react';
import { CyberpunkBackground } from '@/components/CyberpunkBackground';
import { Footer } from '@/components/landing/Footer';
import { PraxisLogo } from '@/components/PraxisLogo';
import { TerminalWindow } from '@/components/TerminalWindow';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [email, setEmail] = useState('dev@example.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [typedText, setTypedText] = useState('');
  
  const fullText = '> login --mode interactive';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace('/courses');
    }
  }, [user, router]);

  // Typing animation effect
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 80);

    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = () => {
    // Go through Next.js Proxy
    window.location.href = '/api/auth/google';
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      // Use replace to prevent back button issues
      router.replace('/courses');
    } else {
      alert(result.error || 'Login failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono selection:bg-indigo-500/30 relative overflow-hidden flex flex-col">
      <CyberpunkBackground />
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative z-20 w-full max-w-2xl">
          <TerminalWindow title="Authentication Protocol v2.0">
            <div className="space-y-8">
              {/* Header Section with Logo and Typing Effect */}
              <div className="text-center space-y-4">
                <div className="inline-block">
                  <PraxisLogo className="text-xs md:text-sm text-cyan-400" />
                </div>
                
                {/* Typing Animation */}
                <div className="flex items-center justify-center gap-2 text-green-400 text-sm md:text-base font-bold">
                  <span>{typedText}</span>
                  <span className="inline-block w-2 h-4 bg-green-400 animate-pulse" />
                </div>
                
                {/* LOGIN Title */}
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-indigo-300 to-cyan-300 tracking-tight mb-2">
                    LOGIN
                  </h1>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    <span className="text-green-400">●</span> System Ready • Awaiting Credentials
                  </p>
                </div>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

              {/* Centered Login Form */}
              <div className="max-w-md mx-auto space-y-5">
                {/* Google Login */}
                <Button 
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold border-0 h-12 rounded-lg shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]" 
                  onClick={handleGoogleLogin}
                >
                  <Chrome className="h-5 w-5" />
                  <span>Sign in with Google</span>
                </Button>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-slate-900 px-4 text-[10px] text-indigo-400 uppercase tracking-widest font-bold flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      Dev Access
                    </span>
                  </div>
                </div>

                {/* Dev Login Form */}
                <form onSubmit={handleDevLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-2">
                      <Mail className="w-3 h-3 text-cyan-400" />
                      Email
                    </label>
                    <Input 
                      type="email" 
                      placeholder="dev@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-cyan-500/20 h-11 font-mono text-sm rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-2">
                      <Lock className="w-3 h-3 text-cyan-400" />
                      Password
                    </label>
                    <Input 
                      type="password" 
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:ring-cyan-500/20 h-11 font-mono text-sm rounded-lg"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold h-12 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        AUTHENTICATING...
                      </>
                    ) : (
                      <>
                        <Terminal className="w-4 h-4 mr-2" />
                        GRANT ACCESS
                      </>
                    )}
                  </Button>
                </form>

                {/* Footer Info */}
                <div className="pt-3 border-t border-slate-800/50">
                  <div className="text-[10px] text-slate-600 uppercase tracking-widest font-mono text-center space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-green-500">●</span>
                      <span>Secure Connection Established</span>
                    </div>
                    <div className="text-slate-700">
                      Default: dev@example.com / 123456
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TerminalWindow>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
