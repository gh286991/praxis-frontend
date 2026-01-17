import { TerminalHero } from '@/components/landing/TerminalHero';
import { getPlatformStats } from '@/lib/api';

export default async function Home() {
  let initialStats = undefined;
  
  try {
    initialStats = await getPlatformStats();
  } catch (error) {
    console.error('Failed to fetch platform stats during SSR:', error);
    // We fail gracefully and let the client try to fetch, or just show 0
  }

  return <TerminalHero initialStats={initialStats} />;
}
