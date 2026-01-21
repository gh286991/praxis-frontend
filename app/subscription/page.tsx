'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Cpu, Zap, TrendingUp, Activity, Clock } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { CyberpunkBackground } from '@/components/CyberpunkBackground';
import { TerminalWindow } from '@/components/TerminalWindow';
import { Footer } from '@/components/landing/Footer';
import { AppNavbar } from '@/components/AppNavbar';

interface UsageStats {
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCalls: number;
  byEndpoint: Record<string, {
    calls: number;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
  }>;
  byModel: Record<string, {
    calls: number;
    totalTokens: number;
  }>;
  credits: {
    available: number;
    total: number;
    used: number;
    granted: number;
  };
  tokensPerCredit?: number; // 从后端获取的转换比例
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getUsageStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  // Convert tokens to Energy (使用从后端获取的比例，默认 1500 tokens = 1 energy)
  const tokensToEnergy = (tokens: number) => {
    const ratio = stats?.tokensPerCredit || 1500;
    return (tokens / ratio).toFixed(2);
  };

  // Get usage level description
  const getUsageLevel = (calls: number) => {
    if (calls === 0) return { level: '未使用', color: 'text-slate-500' };
    if (calls < 10) return { level: '輕度使用', color: 'text-emerald-400' };
    if (calls < 50) return { level: '中度使用', color: 'text-cyan-400' };
    return { level: '重度使用', color: 'text-indigo-400' };
  };

  const getEndpointName = (endpoint: string) => {
    const names: Record<string, string> = {
      '/api/gemini/generate': 'AI Question Generation',
      '/api/execution/run': 'Code Execution',
      '/api/execution/submit': 'Answer Submission',
    };
    return names[endpoint] || endpoint;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 font-mono relative overflow-hidden">
        <CyberpunkBackground />
        <div className="relative z-10 text-center space-y-4">
          <div className="text-cyan-400 font-bold text-xl animate-pulse flex items-center gap-2 justify-center">
            <Activity className="w-5 h-5 animate-spin" />
            <span>LOADING_USAGE_DATA...</span>
          </div>
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
          
          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-indigo-200 tracking-tight mb-2">
              Subscription & Usage
            </h1>
            <p className="text-slate-400 text-sm">
              Monitor your AI token usage and API activity
            </p>
          </div>

          {/* Subscription Status */}
          <TerminalWindow title="SUBSCRIPTION_STATUS">
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded">
              <Zap className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-emerald-400 font-bold">FREE TIER</div>
                <div className="text-xs text-slate-500">Unlimited access to all features</div>
              </div>
            </div>
          </TerminalWindow>

          {/* Energy Balance */}
          {stats && stats.credits && (
            <TerminalWindow title="ENERGY_BALANCE">
              <div className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">剩餘能量</span>
                    <span className="text-lg font-bold text-cyan-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Image 
                          src="/icons/energy-battery.png" 
                          alt="Energy Battery" 
                          width={20} 
                          height={20}
                          className="inline-block"
                        />
                        {stats.credits.available.toFixed(2)} / {stats.credits.total.toFixed(2)}
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        stats.credits.available > 5 
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                          : stats.credits.available > 2
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                          : 'bg-gradient-to-r from-red-500 to-pink-500'
                      }`}
                      style={{ width: `${Math.max(0, (stats.credits.available / stats.credits.total) * 100)}%` }}
                    />
                  </div>
                </div>
                
                {/* Usage Stats */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-700/30">
                    <div className="text-slate-500 mb-1">已消耗</div>
                    <div className="text-lg font-bold text-indigo-400 flex items-center gap-1">
                      <Image 
                        src="/icons/energy-battery.png" 
                        alt="Energy" 
                        width={16} 
                        height={16}
                        className="inline-block opacity-80"
                      />
                      {stats.credits.used.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-700/30">
                    <div className="text-slate-500 mb-1">使用率</div>
                    <div className="text-lg font-bold text-purple-400">
                      {((stats.credits.used / stats.credits.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                {/* Status Message */}
                <div className="flex items-center gap-2 text-sm p-3 rounded border border-slate-700/30">
                  {stats.credits.available > 5 ? (
                    <>
                      <span className="text-emerald-400">✓</span>
                      <span className="text-slate-300">能量充足，可以繼續使用 AI 功能</span>
                    </>
                  ) : stats.credits.available > 2 ? (
                    <>
                      <span className="text-yellow-400">⚠</span>
                      <span className="text-slate-300">能量即將耗盡，建議節省使用</span>
                    </>
                  ) : stats.credits.available > 0 ? (
                    <>
                      <span className="text-orange-400">⚠</span>
                      <span className="text-slate-300">能量不足，請謹慎使用</span>
                    </>
                  ) : (
                    <>
                      <span className="text-red-400">✗</span>
                      <span className="text-slate-300">能量已耗盡，無法使用 AI 功能</span>
                    </>
                  )}
                </div>
              </div>
            </TerminalWindow>
          )}

          {/* Usage Overview */}
          <TerminalWindow title="USAGE_OVERVIEW">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Energy Consumed */}
              <div className="bg-slate-900/50 p-4 rounded border border-cyan-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Image 
                    src="/icons/energy-battery.png" 
                    alt="Energy" 
                    width={16} 
                    height={16}
                    className="inline-block"
                  />
                  <div className="text-xs text-slate-500 uppercase">能量消耗</div>
                </div>
                <div className="text-2xl font-bold text-cyan-400 flex items-center gap-1.5">
                  <Image 
                    src="/icons/energy-battery.png" 
                    alt="Energy" 
                    width={20} 
                    height={20}
                    className="inline-block"
                  />
                  {tokensToEnergy(stats?.totalTokens || 0)}
                </div>
                <div className="text-[10px] text-slate-600 mt-1">
                  已使用的 AI 能量
                </div>
              </div>

              {/* Total Queries */}
              <div className="bg-slate-900/50 p-4 rounded border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <div className="text-xs text-slate-500 uppercase">查詢次數</div>
                </div>
                <div className="text-2xl font-bold text-indigo-400">
                  {formatNumber(stats?.totalCalls || 0)}
                </div>
                <div className="text-[10px] text-slate-600 mt-1">
                  總 AI 請求次數
                </div>
              </div>

              {/* Usage Level */}
              <div className="bg-slate-900/50 p-4 rounded border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <div className="text-xs text-slate-500 uppercase">使用程度</div>
                </div>
                <div className={`text-2xl font-bold ${getUsageLevel(stats?.totalCalls || 0).color}`}>
                  {getUsageLevel(stats?.totalCalls || 0).level}
                </div>
                <div className="text-[10px] text-slate-600 mt-1">
                  根據使用頻率評估
                </div>
              </div>

              {/* Average Energy per Query */}
              <div className="bg-slate-900/50 p-4 rounded border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <div className="text-xs text-slate-500 uppercase">平均消耗</div>
                </div>
                <div className="text-2xl font-bold text-purple-400 flex items-center gap-1">
                  {stats && stats.totalCalls > 0 
                    ? tokensToEnergy(stats.totalTokens / stats.totalCalls)
                    : '0.00'}
                </div>
                <div className="text-[10px] text-slate-600 mt-1">
                  每次查詢消耗能量
                </div>
              </div>
            </div>
          </TerminalWindow>

          {/* Usage by Feature */}
          {stats && Object.keys(stats.byEndpoint).length > 0 && (
            <TerminalWindow title="USAGE_BY_FEATURE">
              <div className="space-y-3">
                {Object.entries(stats.byEndpoint).map(([endpoint, data]) => (
                  <div key={endpoint} className="bg-slate-900/30 p-3 rounded border border-slate-700/30">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <div className="text-sm font-bold text-slate-200">
                          {getEndpointName(endpoint)}
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono mt-1">
                          {endpoint}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-cyan-400">
                          {formatNumber(data.calls)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          次查詢
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-700/30 pt-2">
                      <span className="text-slate-500">消耗能量:</span>
                      <span className="text-indigo-400 font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {tokensToEnergy(data.totalTokens)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TerminalWindow>
          )}

          {/* Usage by Model */}
          {stats && Object.keys(stats.byModel).length > 0 && (
            <TerminalWindow title="USAGE_BY_MODEL">
              <div className="space-y-2">
                {Object.entries(stats.byModel).map(([model, data]) => (
                  <div key={model} className="flex justify-between items-center p-3 bg-slate-900/30 rounded border border-slate-700/30">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-mono text-slate-300">{model}</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-slate-500 text-xs">查詢: </span>
                        <span className="text-cyan-400 font-bold">{formatNumber(data.calls)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">能量: </span>
                        <span className="text-indigo-400 font-bold flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {tokensToEnergy(data.totalTokens)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TerminalWindow>
          )}

          {/* Empty State */}
          {stats && stats.totalCalls === 0 && (
            <TerminalWindow title="NO_DATA">
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <div className="text-slate-500">No usage data yet</div>
                <div className="text-xs text-slate-600 mt-2">
                  Start using AI features to see your usage statistics
                </div>
              </div>
            </TerminalWindow>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
