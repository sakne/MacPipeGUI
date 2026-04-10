import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { Play, Square, Terminal, Lock, Package, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function BuildPage() {
    const profiles = useStore(state => state.profiles);
    const config = useStore(state => state.config);
    const selectedId = useStore(state => state.selectedProfileId) ?? '';
    const selectProfile = useStore(state => state.selectProfile);
    const [isBuilding, setIsBuilding] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [showSteamGuard, setShowSteamGuard] = useState(false);
    const [steamGuardCode, setSteamGuardCode] = useState('');

    const scrollRef = useRef<HTMLDivElement>(null);

    const selectedProfile = profiles.find(p => p.id === selectedId);

    useEffect(() => {
        const ipc = (window as any).ipcRenderer;
        if (!ipc) {
            console.warn('IPC Renderer unavailable');
            setLogs(['⚠️ IPC Renderer unavailable - running in standalone mode']);
            return;
        }

        const cleanupLog = ipc.on('build-log', (_event: any, message: string) => {
            setLogs(prev => [...prev, message]);
        });

        const cleanupComplete = ipc.on('build-complete', (_event: any, code: number) => {
            setIsBuilding(false);
            setLogs(prev => [...prev, `\n🏁 Process finished with exit code ${code}`]);
        });

        const cleanupGuard = ipc.on('steam-guard-request', () => {
            setShowSteamGuard(true);
            setLogs(prev => [...prev, `\n🔐 Steam Guard Code Required!`]);
        });

        return () => {
            if (cleanupLog) cleanupLog();
            if (cleanupComplete) cleanupComplete();
            if (cleanupGuard) cleanupGuard();
        };
    }, []);

    // Auto-scroll to bottom when logs change
    useEffect(() => {
        if (scrollRef.current) {
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 100);
        }
    }, [logs]);

    const handleRun = async () => {
        if (!selectedProfile) return;
        if (!config.builderPath || !config.loginName) {
            alert('Please configure Steam Settings first!');
            return;
        }

        const ipc = (window as any).ipcRenderer;
        if (!ipc) {
            alert('IPC unavailable');
            return;
        }

        // Try to get password from session store first, then secure storage
        let finalPassword = useStore.getState().tempPassword;

        if (!finalPassword) {
            // Fallback to secure storage
            const passResult = await ipc.invoke('get-secure-password');
            if (passResult.success && passResult.password) {
                finalPassword = passResult.password;
            }
        }

        if (!finalPassword) {
            alert('Please enter your Steam Password in Settings first!');
            return;
        }

        setLogs([]);
        setIsBuilding(true);

        ipc.invoke('generate-vdf', selectedProfile, config).then(() => {
            ipc.send('run-build', selectedProfile, config, finalPassword);
        }).catch((err: any) => {
            setLogs(prev => [...prev, `❌ VDF Generation Error: ${err}`]);
            setIsBuilding(false);
        });
    };

    const handleStop = () => {
        const ipc = (window as any).ipcRenderer;
        if (ipc) ipc.send('stop-build');
    };

    const handleTestRun = async () => {
        const ipc = (window as any).ipcRenderer;
        if (!ipc) return;

        if (!selectedProfile) {
            alert('Please select a profile first');
            return;
        }

        setLogs([]);
        ipc.send('test-run', selectedProfile, config);
    };

    const submitGuardCode = () => {
        const ipc = (window as any).ipcRenderer;
        if (ipc) ipc.send('steam-guard-code', steamGuardCode);
        setShowSteamGuard(false);
        setSteamGuardCode('');
        setLogs(prev => [...prev, `> Sending Steam Guard Code...`]);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col h-full w-full bg-bg-main text-text-DEFAULT overflow-hidden"
        >
            {/* Header Section */}
            <div className="p-6 border-b border-white/5 bg-bg-dark shrink-0">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/5 p-2 rounded-lg shadow-inner">
                        <Terminal className="text-accent" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Build Runner</h2>
                </div>

                <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Profile</label>
                        <select
                            value={selectedId}
                            onChange={(e) => selectProfile(e.target.value || null)}
                            className="w-full bg-bg-main border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all font-medium"
                            disabled={isBuilding}
                        >
                            <option value="">-- Select Profile --</option>
                            {profiles.map(p => (
                                <option key={p.id} value={p.id}>{p.appName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleTestRun}
                            className="px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20"
                            title="Validate profile and generate VDF files"
                            disabled={!selectedId}
                        >
                            <Play size={16} fill="currentColor" className="opacity-50" />
                            Test Run
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={isBuilding ? handleStop : handleRun}
                            disabled={!selectedId}
                            className={clsx(
                                "px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg min-w-[140px] justify-center hover:scale-[1.02] active:scale-[0.98]",
                                !selectedId ? "bg-white/5 text-text-muted cursor-not-allowed opacity-50" :
                                    isBuilding ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20" : "bg-accent hover:bg-accent-hover text-white shadow-accent/20"
                            )}
                        >
                            {isBuilding ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                            {isBuilding ? "STOP" : "RUN"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Profile Preview */}
            {selectedProfile && (
                <div className="px-6 py-3 bg-bg-dark/50 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <FileText size={14} className="text-accent" />
                            <span className="text-text-muted">App ID:</span>
                            <span className="text-white font-mono">{selectedProfile.appID || 'Not Set'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Package size={14} className="text-accent" />
                            <span className="text-text-muted">Depots:</span>
                            <span className="text-white font-mono">{selectedProfile.depotProfiles?.length || 0}</span>
                        </div>
                        {selectedProfile.description && (
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-text-muted">Description:</span>
                                <span className="text-white/70 truncate">{selectedProfile.description}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Logs Section*/}
            <div className="flex-1 p-4 min-h-0 flex flex-col overflow-hidden relative">
                <div className="flex-1 rounded-xl bg-gray-900 border border-white/10 shadow-inner overflow-hidden flex flex-col">
                    <div
                        ref={scrollRef}
                        className="flex-1 p-4 overflow-y-auto font-mono text-sm custom-scrollbar"
                        style={{ maxHeight: '100%' }}
                    >
                        {logs.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 select-none opacity-50">
                                <Terminal size={48} className="mb-4 text-white/10" />
                                <p className="font-medium text-lg text-white/20">Ready to build</p>
                            </div>
                        )}
                        <div className="space-y-1">
                            {logs.map((log, i) => (
                                <div key={i} className={clsx(
                                    "whitespace-pre-wrap break-all leading-relaxed",
                                    log.includes('❌') ? "text-red-400 bg-red-500/10 -mx-2 px-2 py-1 rounded border border-red-500/20" :
                                        log.includes('✅') ? "text-green-400 font-bold" :
                                            log.includes('⚠️') ? "text-yellow-400" :
                                                log.includes('🚀') ? "text-blue-400 font-bold" :
                                                    log.includes('📋') || log.includes('📦') || log.includes('⚙️') || log.includes('📝') ? "text-purple-400" :
                                                        log.includes('🧪') ? "text-cyan-400 font-bold text-base" : "text-gray-300"
                                )}>
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showSteamGuard && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.9 }}
                            className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-bg-card border border-accent p-8 rounded-2xl shadow-2xl w-[400px] z-50 ring-4 ring-black/40"
                        >
                            <div className="flex justify-center mb-4">
                                <div className="bg-accent/20 p-4 rounded-full shadow-[0_0_15px_rgba(255,121,198,0.3)]">
                                    <Lock size={32} className="text-accent" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-center mb-2 text-white">Steam Guard Required</h3>
                            <p className="text-sm text-text-muted text-center mb-6">Enter code from your Mobile Authenticator or Email.</p>

                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={steamGuardCode}
                                    onChange={(e) => setSteamGuardCode(e.target.value)}
                                    className="flex-1 bg-bg-main border border-white/10 rounded-lg px-4 py-3 text-center text-xl tracking-[0.5em] font-mono uppercase text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                                    placeholder="XXXXX"
                                    maxLength={5}
                                />
                                <button onClick={submitGuardCode} className="bg-accent hover:bg-accent-hover text-white px-6 rounded-lg font-bold transition-all shadow-lg shadow-accent/20 hover:scale-105 active:scale-95">
                                    Verify
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
