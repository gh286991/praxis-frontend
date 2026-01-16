import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "@/lib/store/slices/userSlice";

interface ProfileHeaderProps {
  user: UserProfile | null;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  if (!user) return null;

  return (
    <div className="relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
      
      <div className="relative flex flex-col md:flex-row items-center gap-6 p-8 bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-full blur opacity-75 animate-pulse" />
          <Avatar className="w-24 h-24 border-2 border-slate-900 relative">
            <AvatarImage src={user.picture} alt={user.name} />
            <AvatarFallback className="text-2xl bg-slate-800 text-slate-200">
              {user.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="text-center md:text-left space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {user.name}
          </h1>
          <p className="text-slate-400 font-mono text-sm max-w-md">
            {user.email}
          </p>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-medium rounded-full border border-indigo-500/20">
              Praxis Member
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
