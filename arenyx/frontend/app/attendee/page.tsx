"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { socket } from '@/lib/socket';
import { AlertTriangle, X, Sparkles } from 'lucide-react';
import { AIChatWidget } from '@/components/AIChatWidget';
import { ArenaMap } from '@/components/ArenaMap';

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    CLEAR: { label: 'Clear', classes: 'bg-green-500/20 text-green-400 border border-green-500/30' },
    FILLING: { label: 'Filling', classes: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' },
    CONGESTED: { label: 'Congested', classes: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  };
  const c = config[status] || config.CLEAR;
  return (
    <span className={`text-xs font-bold font-mono uppercase tracking-wider px-2.5 py-1 rounded-lg ${c.classes}`}>
      {c.label}
    </span>
  );
}

function GateCard({ gate, timelineMins }: { gate: any; timelineMins: number }) {
  const projected = timelineMins > 0
    ? Math.min(100, Math.max(0, gate.density + (gate.status === 'CONGESTED' ? -timelineMins : timelineMins * 1.5)))
    : gate.density;
  const projectedStatus = projected >= 75 ? 'CONGESTED' : projected >= 40 ? 'FILLING' : 'CLEAR';

  return (
    <div className="glass-card p-5 space-y-4 transition-transform hover:-translate-y-1 duration-300">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-extrabold text-[var(--text-primary)]">{gate.name}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{gate.section} Section</p>
        </div>
        <StatusBadge status={projectedStatus} />
      </div>
      <div>
        <div className="flex justify-between text-xs font-bold text-[var(--text-muted)] mb-1.5">
          <span>Crowd Density</span>
          <span>{Math.round(projected)}%</span>
        </div>
        <div className="w-full bg-white/10 dark:bg-white/5 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              projectedStatus === 'CONGESTED' ? 'bg-red-500' :
              projectedStatus === 'FILLING' ? 'bg-yellow-400' : 'bg-green-400'
            }`}
            style={{ width: `${projected}%` }}
          />
        </div>
      </div>
      {gate.aiAction && (
        <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-xl p-3">
          <p className="text-xs font-bold text-[var(--accent)] flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> AI Suggestion
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{gate.aiAction}</p>
        </div>
      )}
    </div>
  );
}

function ConcessionCard({ item, timelineMins }: { item: any; timelineMins: number }) {
  const projectedWait = timelineMins > 0
    ? Math.max(0, Math.round(item.waitTime + (item.status === 'CONGESTED' ? -timelineMins * 0.5 : timelineMins * 0.8)))
    : item.waitTime;
  const projectedStatus = projectedWait >= 20 ? 'CONGESTED' : projectedWait >= 10 ? 'FILLING' : 'CLEAR';

  return (
    <div className="glass-card p-5 space-y-3 transition-transform hover:-translate-y-1 duration-300">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-extrabold text-[var(--text-primary)]">{item.name}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.section}</p>
        </div>
        <StatusBadge status={projectedStatus} />
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-[var(--text-secondary)] font-medium">Wait time</span>
        <span className="font-black text-[var(--text-primary)]">{projectedWait} min</span>
      </div>
      {item.offer && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
          <p className="text-xs font-bold text-yellow-400">🎟 Special Offer</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.offer}</p>
        </div>
      )}
    </div>
  );
}

export default function AttendeePage() {
  const [gates, setGates] = useState<any[]>([]);
  const [concessions, setConcessions] = useState<any[]>([]);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'gates' | 'concessions' | 'heatmap'>('gates');
  const [timelineMins, setTimelineMins] = useState(0);

  useEffect(() => {
    socket.on('crowd_update', (data: any) => {
      if (Array.isArray(data)) {
        setGates(data);
      } else {
        setGates(data.gates || []);
        setConcessions(data.concessions || []);
      }
    });
    socket.on('alert_received', (data: any) => {
      setAlertMsg(data.message);
      setTimeout(() => setAlertMsg(null), 8000);
    });
    socket.on('ai_suggestion', (data: any) => {
      setAiSuggestion(data);
      setTimeout(() => setAiSuggestion(null), 12000);
    });
    return () => {
      socket.off('crowd_update');
      socket.off('alert_received');
      socket.off('ai_suggestion');
    };
  }, []);

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10 opacity-5 dark:opacity-[0.07]"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="fixed inset-0 -z-10 bg-[image:var(--grad-hero)] opacity-80" />
      <div className="fixed top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--accent)]/20 blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[var(--accent)]/10 blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-[var(--bg-primary)]/60 border-b border-white/10 dark:border-white/5">
        <div className="flex items-center space-x-3">
          <Image src="/logo.png" alt="Arenyx" width={34} height={34} className="rounded-xl" />
          <span className="font-black text-lg tracking-tight">Arenyx</span>
        </div>
        <span className="text-xs text-[var(--text-muted)] font-mono bg-white/10 dark:bg-white/5 px-3 py-1.5 rounded-lg">
          🟢 Live Feed Active
        </span>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Alert Banner */}
        {alertMsg && (
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-red-900/40 border border-red-500/30 backdrop-blur-md animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-sm font-bold text-red-200">{alertMsg}</p>
            </div>
            <button onClick={() => setAlertMsg(null)} className="text-red-400 hover:text-red-200 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* AI Suggestion Banner */}
        {aiSuggestion && (
          <div className="glass-card p-4 border-l-4 border-[var(--accent)] animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest mb-1.5">
                  {aiSuggestion.type === 'CONCESSION' ? '✨ AI Fast-Pass Offer' : '🚨 AI Live Alert'}
                </p>
                <p className="text-sm font-bold text-[var(--text-primary)]">{aiSuggestion.attendeeMsg}</p>
                {aiSuggestion.incentive && (
                  <span className="inline-block mt-2 text-xs font-black bg-[var(--accent)]/20 text-[var(--accent)] px-2.5 py-1 rounded-lg uppercase tracking-wide">
                    🎟 {aiSuggestion.incentive}
                  </span>
                )}
              </div>
              <button onClick={() => setAiSuggestion(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Timeline Control */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-extrabold text-[var(--text-primary)]">Digital Twin Predictor</p>
              <p className="text-xs text-[var(--text-muted)]">Simulate future crowd states</p>
            </div>
            <span className="text-xs font-mono font-bold bg-[var(--accent)]/20 text-[var(--accent)] px-3 py-1.5 rounded-lg">
              {timelineMins === 0 ? '⚡ Live' : `+${timelineMins} min`}
            </span>
          </div>
          <input
            type="range" min="0" max="30" value={timelineMins}
            onChange={e => setTimelineMins(parseInt(e.target.value))}
            className="w-full cursor-pointer accent-[var(--accent)]"
          />
          <div className="flex justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>Now</span>
            <span>30 mins</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 p-1.5 bg-white/10 dark:bg-white/5 rounded-2xl backdrop-blur-sm">
          {(['gates', 'concessions', 'heatmap'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-white dark:bg-white/15 text-[var(--text-primary)] shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab === 'gates' ? '🚪 Gates' : tab === 'concessions' ? '🍔 Concessions' : '🌡 Heatmap'}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'gates' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gates.length === 0 ? (
              <div className="col-span-2 text-center py-16 text-[var(--text-muted)]">
                <p className="text-2xl mb-2">📡</p>
                <p className="font-bold">Connecting to live data...</p>
              </div>
            ) : (
              gates.map(g => <GateCard key={g.id} gate={g} timelineMins={timelineMins} />)
            )}
          </div>
        )}
        {activeTab === 'concessions' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {concessions.length === 0 ? (
              <div className="col-span-2 text-center py-16 text-[var(--text-muted)]">
                <p className="text-2xl mb-2">🍔</p>
                <p className="font-bold">No concession data yet.</p>
              </div>
            ) : (
              concessions.map(c => <ConcessionCard key={c.id} item={c} timelineMins={timelineMins} />)
            )}
          </div>
        )}
        {activeTab === 'heatmap' && (
          <ArenaMap gates={gates} concessions={concessions} />
        )}
      </div>

      <AIChatWidget />
    </main>
  );
}
