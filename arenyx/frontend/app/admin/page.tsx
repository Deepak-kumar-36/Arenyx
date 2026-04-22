"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { socket } from '@/lib/socket';
import {
  ShieldAlert, BellRing, Activity, CheckCircle2, Coffee, MapPin,
  Sparkles, Clock, AlertTriangle,
} from 'lucide-react';
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

export default function AdminPage() {
  const [liveGates, setLiveGates] = useState<any[]>([]);
  const [liveConcessions, setLiveConcessions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [timelineMins, setTimelineMins] = useState(0);
  const [dispatchedGates, setDispatchedGates] = useState<Set<string>>(new Set());

  useEffect(() => {
    socket.on('crowd_update', (data: any) => {
      if (Array.isArray(data)) {
        setLiveGates(data);
      } else {
        setLiveGates(data.gates || []);
        setLiveConcessions(data.concessions || []);
      }
    });
    socket.on('alert_received', (data: any) => {
      setAlerts(prev => [data, ...prev].slice(0, 10));
    });
    return () => {
      socket.off('crowd_update');
      socket.off('alert_received');
    };
  }, []);

  const getProjectedDensity = (base: number, status: string, mins: number) => {
    if (mins === 0) return base;
    let v = base;
    if (status === 'CONGESTED') v -= mins;
    else if (status === 'FILLING') v += mins * 2;
    else v += mins * 0.5;
    return Math.max(0, Math.min(100, Math.round(v)));
  };

  const getProjectedWait = (base: number, status: string, mins: number) => {
    if (mins === 0) return base;
    let v = base;
    if (status === 'CONGESTED') v -= mins * 0.5;
    else if (status === 'FILLING') v += mins;
    else v += mins * 0.2;
    return Math.max(0, Math.round(v));
  };

  const gates = liveGates.map(g => {
    const d = getProjectedDensity(g.density, g.status, timelineMins);
    const s = d >= 75 ? 'CONGESTED' : d >= 40 ? 'FILLING' : 'CLEAR';
    return { ...g, density: d, status: s };
  });

  const concessions = liveConcessions.map(c => {
    const w = getProjectedWait(c.waitTime, c.status, timelineMins);
    const s = w >= 20 ? 'CONGESTED' : w >= 10 ? 'FILLING' : 'CLEAR';
    return { ...c, waitTime: w, status: s };
  });

  const congestedGates = gates.filter(g => g.status === 'CONGESTED').length;
  const avgDensity = gates.length > 0
    ? Math.round(gates.reduce((sum, g) => sum + g.density, 0) / gates.length)
    : 0;

  const handleBroadcast = () => {
    socket.emit('staff_broadcast', 'Global Alert: Please disperse from central blocks and use side exits immediately.');
    setBroadcastSent(true);
    setAlerts(prev => [{ message: 'Global broadcast sent: Disperse from central blocks.' }, ...prev].slice(0, 10));
    setTimeout(() => setBroadcastSent(false), 10000);
  };

  const handleDispatch = (id: string, msg: string) => {
    socket.emit('staff_broadcast', `Staff Action Required: ${msg}`);
    setDispatchedGates(prev => new Set(prev).add(id));
    setAlerts(prev => [{ message: `Staff dispatched: ${msg}` }, ...prev].slice(0, 10));
    setTimeout(() => {
      setDispatchedGates(prev => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
      <div className="fixed inset-0 -z-10 bg-[image:var(--grad-hero)] opacity-60" />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[var(--accent)]/15 blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[var(--accent)]/10 blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-[var(--bg-primary)]/60 border-b border-white/10 dark:border-white/5">
        <div className="flex items-center space-x-4">
          <Image src="/logo.png" alt="Arenyx" width={34} height={34} className="rounded-xl" />
          <div>
            <p className="font-black text-lg tracking-tight">Arenyx Admin</p>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              {timelineMins > 0 ? `⏱ Simulation: +${timelineMins} min` : '⚡ Live Monitor'}
            </p>
          </div>
        </div>
        <button
          onClick={handleBroadcast}
          disabled={broadcastSent}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
            broadcastSent
              ? 'bg-[var(--text-muted)]/30 text-[var(--text-muted)] cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-500 text-white active:scale-95 shadow-lg shadow-red-900/30'
          }`}
        >
          <BellRing className="h-4 w-4" />
          {broadcastSent ? 'Broadcast Sent... (cooldown)' : 'Global Broadcast'}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 p-4 space-y-4 overflow-y-auto border-r border-white/10 dark:border-white/5">
          {/* Stats */}
          <div className="glass-card p-5 space-y-4">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Live Overview</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 dark:bg-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-[var(--text-primary)]">{gates.length + concessions.length}</p>
                <p className="text-xs text-[var(--text-muted)]">Monitored</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${congestedGates > 0 ? 'bg-red-900/40' : 'bg-white/10 dark:bg-white/5'}`}>
                <p className={`text-2xl font-black ${congestedGates > 0 ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>{congestedGates}</p>
                <p className="text-xs text-[var(--text-muted)]">Congested</p>
              </div>
              <div className="bg-white/10 dark:bg-white/5 rounded-xl p-3 text-center col-span-2">
                <p className="text-2xl font-black text-[var(--text-primary)]">{avgDensity}%</p>
                <p className="text-xs text-[var(--text-muted)]">Avg Density</p>
              </div>
            </div>
          </div>

          {/* Digital Twin */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-[var(--accent)]" />
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Digital Twin</p>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Predictive simulation timeline</p>
            <input
              type="range" min="0" max="30" value={timelineMins}
              onChange={e => setTimelineMins(parseInt(e.target.value))}
              className="w-full cursor-pointer accent-[var(--accent)]"
            />
            <div className="flex justify-between text-xs font-bold text-[var(--text-muted)]">
              <span>Live</span>
              <span>{timelineMins > 0 ? `+${timelineMins}m` : 'Now'}</span>
            </div>
          </div>

          {/* Alert Log */}
          <div className="glass-card p-5 space-y-3 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Alert Log</p>
            </div>
            {alerts.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">No alerts yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {alerts.map((a, i) => (
                  <div key={i} className="bg-red-900/20 border border-red-500/20 rounded-xl p-2.5">
                    <p className="text-xs text-red-300 font-semibold">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--accent)]" />
              Live AI Monitor
            </h1>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              {gates.length + concessions.length} zones tracked
            </span>
          </div>

          {/* Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/5">
                  <tr>
                    {['Zone', 'Type', 'Metric', 'Status', 'AI Action', 'Controls'].map(h => (
                      <th key={h} className="px-5 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gates.map(gate => (
                    <tr key={gate.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 font-extrabold text-[var(--text-primary)] whitespace-nowrap">{gate.name}</td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-semibold">
                          <MapPin className="h-3.5 w-3.5" /> Gate
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-[130px]">
                          <div className="flex-1 bg-white/10 dark:bg-white/5 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-1000 ${
                                gate.status === 'CONGESTED' ? 'bg-red-500' :
                                gate.status === 'FILLING' ? 'bg-yellow-400' : 'bg-green-400'
                              }`}
                              style={{ width: `${gate.density}%` }}
                            />
                          </div>
                          <span className="text-xs font-black text-[var(--text-primary)] w-9">{gate.density}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={gate.status} /></td>
                      <td className="px-5 py-4 max-w-[200px]">
                        {timelineMins > 0 ? (
                          <span className="text-xs text-[var(--text-muted)] italic">Simulation mode</span>
                        ) : gate.aiAction ? (
                          <span className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1">
                            <Sparkles className="h-3 w-3 flex-shrink-0" />
                            {gate.aiAction}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)] italic">No action needed</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {gate.status === 'CONGESTED' && timelineMins === 0 && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDispatch(gate.id, gate.aiAction)}
                              disabled={dispatchedGates.has(gate.id)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                                dispatchedGates.has(gate.id)
                                  ? 'bg-[var(--text-muted)]/30 text-[var(--text-muted)] cursor-not-allowed'
                                  : 'bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-white active:scale-95'
                              }`}
                            >
                              {dispatchedGates.has(gate.id) ? '✓ Sent' : 'Dispatch'}
                            </button>
                            <button
                              onClick={() => socket.emit('mark_resolved', { id: gate.id, type: 'GATE' })}
                              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                              title="Mark as resolved"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-400" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {concessions.map(item => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors bg-white/[0.02]">
                      <td className="px-5 py-4 font-extrabold text-[var(--text-primary)] whitespace-nowrap">{item.name}</td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-semibold">
                          <Coffee className="h-3.5 w-3.5" /> Food
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-black text-[var(--text-primary)] whitespace-nowrap">
                        {item.waitTime} min wait
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                      <td className="px-5 py-4">
                        {item.offer ? (
                          <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                            🎟 {item.offer}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)] italic">No offer active</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {item.status === 'CONGESTED' && timelineMins === 0 && (
                          <button
                            onClick={() => socket.emit('mark_resolved', { id: item.id, type: 'CONCESSION' })}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            title="Mark as resolved"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {gates.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-[var(--text-muted)]">
                          <Activity className="h-8 w-8 opacity-30" />
                          <p className="font-bold">Connecting to live data stream...</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Heatmap */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                <span className="text-lg">🌡</span> Stadium Heatmap
              </h2>
              <span className="text-xs font-mono text-[var(--text-muted)] bg-white/10 dark:bg-white/5 px-3 py-1 rounded-lg">
                {timelineMins > 0 ? `⏱ +${timelineMins}m projection` : '⚡ Live'}
              </span>
            </div>
            <ArenaMap gates={gates} concessions={concessions} />
          </div>
        </main>
      </div>
    </div>
  );
}
