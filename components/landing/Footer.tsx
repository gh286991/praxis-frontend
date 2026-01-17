import Link from 'next/link';
import { Github, Twitter, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative z-20 w-full py-6 mt-auto border-t border-slate-800/50 bg-slate-950/30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Copyright */}
        <div className="text-slate-500 text-xs font-mono">
          <span className="text-slate-400">© 2026 PRAXIS SYSTEM.</span> ALL RIGHTS RESERVED.
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-xs font-mono text-slate-500">
          <Link href="/privacy" className="hover:text-cyan-400 transition-colors">PRIVACY</Link>
          <Link href="/terms" className="hover:text-cyan-400 transition-colors">TERMS</Link>
          <Link href="/status" className="hover:text-cyan-400 transition-colors">STATUS</Link>
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-4">
          <a href="#" className="text-slate-500 hover:text-indigo-400 transition-colors">
            <Github className="w-4 h-4" />
          </a>
          <a href="#" className="text-slate-500 hover:text-cyan-400 transition-colors">
            <Twitter className="w-4 h-4" />
          </a>
          <a href="#" className="text-slate-500 hover:text-emerald-400 transition-colors">
            <Mail className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
