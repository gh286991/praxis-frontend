/**
 * CyberpunkBackground - Reusable animated background component
 * Features: Digital Nebula effect with animated gradients, grid patterns, and scanlines
 */
export function CyberpunkBackground() {
  return (
    <>
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0f172a_0%,#020617_100%)] fixed -z-10" />
      
      {/* Animated Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[100px] animate-pulse mix-blend-screen fixed -z-10" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse delay-1000 mix-blend-screen fixed -z-10" />
      <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-violet-600/30 rounded-full blur-[140px] animate-pulse delay-2000 mix-blend-screen fixed -z-10" />
      
      {/* Grid Pattern (Large) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#475569_1px,transparent_1px),linear-gradient(to_bottom,#475569_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)] opacity-[0.25] pointer-events-none fixed -z-10" />
      
      {/* Grid Pattern (Small) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#818cf8_1px,transparent_1px),linear-gradient(to_bottom,#818cf8_1px,transparent_1px)] bg-[size:12rem_12rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.15] pointer-events-none mix-blend-overlay fixed -z-10" />
      
      {/* Scanlines */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] z-0 opacity-40 fixed -z-10" />
      
      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.6)_100%)] z-10 fixed -z-10" />
    </>
  );
}
