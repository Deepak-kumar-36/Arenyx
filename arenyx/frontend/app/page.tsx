"use client";
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Ticket, Loader2, ArrowRight, Activity, Users } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'ATTENDEE' | 'STAFF'>('ATTENDEE');
  const [isLoading, setIsLoading] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (role === 'ATTENDEE') {
        router.push('/attendee');
      } else {
        router.push('/admin');
      }
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] flex text-[var(--text-primary)]">
      {/* Left Panel: Branding & Value Prop */}
      <div className="hidden lg:flex flex-1 relative bg-[var(--grad-hero)] p-12 flex-col justify-between overflow-hidden shadow-2xl z-10">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
        
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[var(--accent)]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-10">
            <Image src="/logo.png" alt="Arenyx Logo" width={52} height={52} className="rounded-2xl shadow-lg" />
            <span className="text-4xl font-black tracking-tighter text-[var(--text-primary)] drop-shadow-sm">Arenyx</span>
          </div>

          <h1 className="text-6xl font-extrabold leading-[1.1] tracking-tight mb-8">
            Next-Gen <br/>
            <span className="text-white drop-shadow-md">Crowd Flow</span> <br/>
            Intelligence.
          </h1>
          <p className="text-xl font-medium text-[var(--text-secondary)] max-w-md leading-relaxed">
            Eliminate bottlenecks. Gamify concessions. Coordinate globally. The operating system for large-scale sporting venues.
          </p>

          <div className="mt-12 flex flex-col space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-md">
                 <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">Real-Time Digital Twin</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-md">
                 <Users className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">Predictive Load Balancing</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm font-bold text-[var(--text-secondary)] opacity-80">
          © 2026 Arenyx Systems. Hackathon Edition.
        </div>
      </div>

      {/* Right Panel: Auth Gateway */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-6 right-6 z-20">
            <ThemeToggle />
        </div>
        <div className="lg:hidden absolute top-8 left-8 flex items-center space-x-2">
            <Image src="/logo.png" alt="Arenyx Logo" width={32} height={32} className="rounded-lg" />
            <span className="text-2xl font-black tracking-tighter text-[var(--text-primary)]">Arenyx</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">Welcome Back</h2>
            <p className="text-[var(--text-secondary)] font-medium">Please select your ecosystem role to continue.</p>
          </div>

          {/* Role Toggle */}
          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-md p-1.5 rounded-2xl flex items-center shadow-inner mb-8">
            <button
              onClick={() => setRole('ATTENDEE')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center transition-all duration-300 ${
                role === 'ATTENDEE' 
                  ? 'bg-white dark:bg-[#1a1919] text-[var(--text-primary)] shadow-md scale-[1.02]' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Ticket className="h-4 w-4 mr-2" />
              Attendee
            </button>
            <button
              onClick={() => setRole('STAFF')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center transition-all duration-300 ${
                role === 'STAFF' 
                  ? 'bg-[var(--text-primary)] text-white shadow-md scale-[1.02]' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Command Staff
            </button>
          </div>

          {/* Login Form */}
          <form className="glass-card p-8 flex flex-col space-y-6 shadow-2xl" onSubmit={handleLogin}>
            {role === 'ATTENDEE' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Ticket ID</label>
                <input 
                  type="text" 
                  required
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  placeholder="e.g. AX-94827" 
                  className="w-full bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition shadow-inner"
                />
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Staff Email</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@arenyx.io" 
                    className="w-full bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition shadow-inner"
                  />
                </div>
                <div>
                   <div className="flex justify-between mb-2">
                     <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Master Password</label>
                     <span className="text-xs font-semibold text-[var(--accent)] cursor-pointer hover:underline">Forgot?</span>
                   </div>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm font-bold placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition shadow-inner"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 mt-4 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg transition-all duration-300 ${
                isLoading ? 'bg-[var(--text-muted)] cursor-not-allowed text-white' : 
                role === 'STAFF' ? 'bg-[var(--text-primary)] text-white hover:bg-black active:scale-95' : 'bg-[image:var(--grad-cta)] text-white hover:opacity-90 active:scale-95'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{role === 'ATTENDEE' ? 'Access Ticket Hub' : 'Enter Command Center'}</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
            <p className="text-center text-xs text-[var(--text-muted)] font-medium pt-2">
              For demo purposes, enter any {role === 'ATTENDEE' ? 'Ticket ID' : 'credentials'} to bypass auth.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
