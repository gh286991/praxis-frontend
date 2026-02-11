'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Cpu, Zap, TrendingUp, Activity, Clock, CreditCard, BarChart3, Rocket, Check, HelpCircle } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { CyberpunkBackground } from '@/components/CyberpunkBackground';
import { TerminalWindow } from '@/components/TerminalWindow';
import { Footer } from '@/components/landing/Footer';
import { AppNavbar } from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';

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
    daily: {
      available: number;
      total: number;
      used: number;
    };
    wallet: {
      balance: number;
    };
    // Legacy support
    available: number;
    total: number;
    used: number;
    granted: number;
  };
  tokensPerCredit?: number;
  planTier?: 'free' | 'pro' | 'team';
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [activeTab, setActiveTab] = useState<'subscription' | 'usage'>('subscription');
  const [billingMode, setBillingMode] = useState<'monthly' | 'topup'>('monthly');

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
              管理您的訂閱方案與能量儲值
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-6 py-3 text-sm font-bold flex items-center gap-2 transition-colors relative ${
                activeTab === 'subscription'
                  ? 'text-cyan-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              訂閱方案 (Subscription)
              {activeTab === 'subscription' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`px-6 py-3 text-sm font-bold flex items-center gap-2 transition-colors relative ${
                activeTab === 'usage'
                  ? 'text-indigo-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              使用統計 (Usage)
              {activeTab === 'usage' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
              )}
            </button>
          </div>

          {/* Subscription Tab Content */}
          {activeTab === 'subscription' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Energy Overview */}
              {stats && stats.credits && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Daily Free Energy */}
                  <TerminalWindow title="DAILY_ENERGY (每日免費)">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-emerald-400">今日可用 ({stats.planTier === 'free' ? '免費版' : stats.planTier === 'pro' ? '專業版' : '團隊版'})</span>
                          <span className="text-lg font-bold text-emerald-400">
                            <span className="inline-flex items-center gap-1.5">
                              <Zap className="w-4 h-4" />
                              {stats.credits.daily.available.toFixed(1)} / {stats.credits.daily.total.toFixed(0)}
                            </span>
                          </span>
                        </div>
                        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                            style={{ width: `${Math.max(0, (stats.credits.daily.available / stats.credits.daily.total) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>已使用: {stats.credits.daily.used.toFixed(2)}</span>
                          <span>每日 UTC 00:00 自動重置</span>
                        </div>
                      </div>
                    </div>
                  </TerminalWindow>

                  {/* Wallet Energy */}
                  <TerminalWindow title="ENERGY_WALLET (能量錢包)">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-yellow-400">錢包餘額 (永久有效)</span>
                          <span className="text-lg font-bold text-yellow-400">
                            <span className="inline-flex items-center gap-1.5">
                              <CreditCard className="w-4 h-4" />
                              {stats.credits.wallet.balance.toFixed(1)}
                            </span>
                          </span>
                        </div>
                        {stats.credits.wallet.balance === 0 ? (
                          <button
                            onClick={() => {
                              setBillingMode('topup');
                              // Wait for tab switch, then scroll to top-up section
                              setTimeout(() => {
                                const topupSection = document.getElementById('topup-section');
                                if (topupSection) {
                                  topupSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }, 100);
                            }}
                            className="w-full p-3 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 hover:from-yellow-600/30 hover:to-orange-600/30 rounded border border-yellow-400/40 text-sm text-yellow-300 font-bold transition-all duration-300 hover:border-yellow-400/60 flex items-center justify-center gap-2 group"
                          >
                            <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            立即儲值
                          </button>
                        ) : (
                          <div className="p-3 bg-yellow-400/10 rounded border border-yellow-400/20 text-xs text-yellow-200/80">
                            當每日免費能量用完時，系統將自動扣除錢包點數。
                          </div>
                        )}
                      </div>
                    </div>
                  </TerminalWindow>
                </div>
              )}

              {/* Billing Mode Tabs */}
              <div className="flex justify-center mb-8 mt-8">
                <div className="bg-slate-900/50 p-1 rounded-lg border border-slate-800 inline-flex shadow-lg">
                  <button
                    onClick={() => setBillingMode('monthly')}
                    className={`px-8 py-2.5 rounded-md text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                      billingMode === 'monthly'
                        ? 'bg-slate-800/80 text-cyan-400 shadow-md border border-cyan-500/30'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    訂閱會員 (Subscription)
                  </button>
                  <button
                    onClick={() => setBillingMode('topup')}
                    className={`px-8 py-2.5 rounded-md text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                      billingMode === 'topup'
                        ? 'bg-slate-800/80 text-yellow-400 shadow-md border border-yellow-500/30'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    儲值 (Top-up)
                  </button>
                </div>
              </div>

              {/* Monthly Subscriptions */}
              {billingMode === 'monthly' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center gap-2 mb-4 px-2">
                    <div className="h-6 w-1 bg-cyan-400 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-white">訂閱會員 (Subscription)</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Starter Plan */}
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-b from-slate-700 to-slate-900 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                      <div className="relative h-full bg-slate-900/80 border border-slate-700/50 rounded-xl p-6 flex flex-col backdrop-blur-sm">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-slate-200">入門版</h3>
                            <p className="text-slate-400 text-sm mt-1">適合剛開始學習 Python 的初學者</p>
                        </div>
                        <div className="text-3xl font-black text-white mb-6 font-mono">
                            免費 <span className="text-sm text-slate-500 font-normal">/ 永久</span>
                        </div>
                        
                        <ul className="space-y-3 mb-8 flex-1">
                            <li className="flex items-start gap-2 text-sm text-slate-300">
                                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                <span>每日 <strong className="text-white">3 點</strong> 能量</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-300">
                                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                <span>標準執行速度</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-300">
                                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                <span>社群支援</span>
                            </li>
                        </ul>

                        <Button disabled={stats?.planTier === 'free'} className="w-full bg-slate-800 text-slate-300 font-bold border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider">
                            {stats?.planTier === 'free' ? '目前方案' : '降級至入門版'}
                        </Button>
                      </div>
                    </div>

                    {/* Pro Plan */}
                    <div className="relative group transform md:-translate-y-4">
                      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500 to-indigo-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                      <div className="relative h-full bg-slate-900/90 border border-cyan-500/50 rounded-xl p-6 flex flex-col shadow-2xl backdrop-blur-md">
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase tracking-wider box-shadow-glow">
                            Recommended
                        </div>
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                專業版 <Rocket className="w-4 h-4 text-cyan-400" />
                            </h3>
                            <p className="text-cyan-100/70 text-sm mt-1">適合認真的學習者與開發者</p>
                        </div>
                        <div className="text-3xl font-black text-white mb-6 font-mono">
                            $15 <span className="text-sm text-slate-400 font-normal">/ 月</span>
                        </div>
                        
                        <ul className="space-y-3 mb-8 flex-1">
                            <li className="flex items-start gap-2 text-sm text-white">
                                <Check className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                                <span>每日 <strong className="text-cyan-400">100 點</strong> 能量</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-white">
                                <Check className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                                <span>快速執行優先權</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-white">
                                <Check className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                                <span>優先 AI 家教支援</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-white">
                                <Check className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                                <span>使用 GPT-4 模型</span>
                            </li>
                        </ul>

                        <Button disabled className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white border-0 font-bold shadow-[0_0_20px_rgba(6,182,212,0.5)] cursor-not-allowed opacity-90 hover:opacity-100 uppercase tracking-wider">
                            {stats?.planTier === 'pro' ? '目前方案' : '即將推出 (Coming Soon)'}
                        </Button>
                      </div>
                    </div>

                    {/* Team Plan */}
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-b from-slate-700 to-slate-900 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                      <div className="relative h-full bg-slate-900/80 border border-slate-700/50 rounded-xl p-6 flex flex-col backdrop-blur-sm">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-slate-200">團隊版</h3>
                            <p className="text-slate-400 text-sm mt-1">適合學校與教育機構</p>
                        </div>
                        <div className="text-3xl font-black text-white mb-6 font-mono">
                            客製化
                        </div>
                        
                        <ul className="space-y-3 mb-8 flex-1">
                            <li className="flex items-start gap-2 text-sm text-slate-300">
                                <Check className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                                <span><strong>無限能量</strong></span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-300">
                                <Check className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                                <span>專屬基礎設施</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-300">
                                <Check className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                                <span>教師儀表板與數據分析</span>
                            </li>
                        </ul>

                        <Button asChild className="w-full bg-white text-slate-900 hover:bg-slate-200 font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all">
                            <a href="mailto:contact@tqc-python.com">聯絡我們</a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Energy Top-up Section */}
              {billingMode === 'topup' && (
                <div id="topup-section" className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
                  <div className="flex items-center gap-2 mb-4 px-2">
                    <div className="h-6 w-1 bg-yellow-400 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-white">儲值 (Top-up)</h2>
                  </div>

                  {/* Info Banner */}
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
                    <Zap className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                    <div className="text-sm text-yellow-100/80">
                      <p className="font-bold text-yellow-400 mb-1">靈活加值，永久有效</p>
                      <p>購買的能量點數永久保存在您的錢包中，可隨時使用，不受時間限制。適合不定期使用或需要大量能量的情境。</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Top-up Option 1 */}
                      <div className="bg-slate-900/50 border border-yellow-500/20 rounded-xl p-5 flex flex-col hover:border-yellow-500/50 transition-colors group cursor-pointer hover:bg-slate-800/50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-lg font-bold text-yellow-400 mb-1">100 點能量</div>
                            <div className="text-xs text-slate-500">約 150,000 Tokens</div>
                          </div>
                          <div className="text-2xl font-black text-white">$5</div>
                        </div>
                        <div className="text-xs text-slate-400 mb-4 flex-1">
                          適合偶爾需要額外能量的使用者
                        </div>
                        <Button className="w-full bg-yellow-600/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-600/30 font-bold">
                          購買
                        </Button>
                      </div>

                      {/* Top-up Option 2 - Best Value */}
                      <div className="relative bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-xl p-5 flex flex-col hover:border-yellow-500/60 transition-colors group cursor-pointer hover:bg-gradient-to-br hover:from-yellow-900/30 hover:to-orange-900/30 shadow-lg">
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-xl shadow-md">
                          最超值
                        </div>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-lg font-bold text-yellow-400 mb-1">500 點能量</div>
                            <div className="text-xs text-emerald-400">約 750,000 Tokens</div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="text-2xl font-black text-white">$20</div>
                            <div className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded mt-1">省 $5 (-20%)</div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-300 mb-4 flex-1">
                          <strong className="text-yellow-400">推薦選擇！</strong>最划算的方案，適合經常使用的學習者
                        </div>
                        <Button className="w-full bg-gradient-to-r from-yellow-600/30 to-orange-600/30 text-yellow-300 border border-yellow-500/60 hover:from-yellow-600/40 hover:to-orange-600/40 font-bold shadow-md">
                          購買
                        </Button>
                      </div>

                      {/* Top-up Option 3 */}
                      <div className="bg-slate-900/50 border border-yellow-500/20 rounded-xl p-5 flex flex-col hover:border-yellow-500/50 transition-colors group cursor-pointer hover:bg-slate-800/50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-lg font-bold text-yellow-400 mb-1">1,000 點能量</div>
                            <div className="text-xs text-slate-500">約 1,500,000 Tokens</div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="text-2xl font-black text-white">$35</div>
                            <div className="text-xs text-emerald-400 font-bold">省 $15 (-30%)</div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-400 mb-4 flex-1">
                          適合重度使用者或團隊共用
                        </div>
                        <Button className="w-full bg-yellow-600/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-600/30 font-bold">
                          購買
                        </Button>
                      </div>
                  </div>

                  {/* Comparison Table */}
                  <TerminalWindow title="方案比較 (PLAN_COMPARISON)">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-4 text-slate-400 font-bold">方案</th>
                            <th className="text-center py-3 px-4 text-slate-400 font-bold">能量點數</th>
                            <th className="text-center py-3 px-4 text-slate-400 font-bold">價格</th>
                            <th className="text-center py-3 px-4 text-slate-400 font-bold">單位成本</th>
                            <th className="text-center py-3 px-4 text-slate-400 font-bold">省下金額</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-800 hover:bg-slate-800/30">
                            <td className="py-3 px-4 text-slate-300">基礎包</td>
                            <td className="text-center py-3 px-4 text-white font-mono">100</td>
                            <td className="text-center py-3 px-4 text-emerald-400 font-bold">$5</td>
                            <td className="text-center py-3 px-4 text-slate-400 font-mono">$0.05/點</td>
                            <td className="text-center py-3 px-4 text-slate-500">-</td>
                          </tr>
                          <tr className="border-b border-slate-800 hover:bg-slate-800/30 bg-yellow-500/5">
                            <td className="py-3 px-4 text-yellow-400 font-bold flex items-center gap-2">
                              超值包
                              <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded">推薦</span>
                            </td>
                            <td className="text-center py-3 px-4 text-white font-mono font-bold">500</td>
                            <td className="text-center py-3 px-4 text-emerald-400 font-bold">$20</td>
                            <td className="text-center py-3 px-4 text-emerald-400 font-mono font-bold">$0.04/點</td>
                            <td className="text-center py-3 px-4 text-emerald-400 font-bold">$5 (20%)</td>
                          </tr>
                          <tr className="hover:bg-slate-800/30">
                            <td className="py-3 px-4 text-slate-300">進階包</td>
                            <td className="text-center py-3 px-4 text-white font-mono">1,000</td>
                            <td className="text-center py-3 px-4 text-emerald-400 font-bold">$35</td>
                            <td className="text-center py-3 px-4 text-emerald-400 font-mono">$0.035/點</td>
                            <td className="text-center py-3 px-4 text-emerald-400 font-bold">$15 (30%)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </TerminalWindow>
                </div>
              )}

              {/* What is Energy Explanation */}
              <TerminalWindow title="系統說明：混合能量機制">
                <div className="flex gap-4 p-2 items-start">
                    <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                        <HelpCircle className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="space-y-2 text-sm text-slate-300">
                        <p>
                            本平台採用<strong className="text-white">混合能量機制</strong>，讓您使用 AI 功能更彈性：
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div className="bg-slate-900/50 p-3 rounded border border-emerald-500/20">
                                <div className="text-emerald-400 font-bold mb-1">1. 每日免費能量</div>
                                <div className="text-xs text-slate-400">
                                    每天 UTC 00:00 自動補滿。
                                    <br/>
                                    <strong>優先扣除</strong>此額度。
                                </div>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded border border-yellow-500/20">
                                <div className="text-yellow-400 font-bold mb-1">2. 能量錢包 (加值)</div>
                                <div className="text-xs text-slate-400">
                                    購買的點數永久有效。
                                    <br/>
                                    當免費能量用完時，才扣除此餘額。
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </TerminalWindow>

            </div>
          )}

          {/* Usage Tab Content */}
          {activeTab === 'usage' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
