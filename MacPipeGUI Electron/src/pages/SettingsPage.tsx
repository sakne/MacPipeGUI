import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { FolderOpen, Save, Settings as SettingsIcon, Shield, ShieldOff, Eye, EyeOff, Lock } from 'lucide-react';

export default function SettingsPage() {
    const config = useStore(state => state.config);
    const updateConfig = useStore(state => state.updateConfig);
    const [builderPath, setBuilderPath] = useState(config.builderPath);
    const [loginName, setLoginName] = useState(config.loginName);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberPassword, setRememberPassword] = useState(config.rememberPassword ?? true);
    const [isEncrypted, setIsEncrypted] = useState(false);
    const [validationStatus, setValidationStatus] = useState<{ valid: boolean, message: string } | null>(null);
    const [passwordSaveStatus, setPasswordSaveStatus] = useState<string | null>(null);
    const [passwordLoadError, setPasswordLoadError] = useState<string | null>(null);

    const setTempPassword = useStore(state => state.setTempPassword);

    // Load saved password on mount
    useEffect(() => {
        const loadPassword = async () => {
            const ipc = (window as any).ipcRenderer;
            if (!ipc) return;

            try {
                const encAvailable = await ipc.invoke('is-encryption-available');
                setIsEncrypted(encAvailable);

                const result = await ipc.invoke('get-secure-password');
                if (result.success && result.password) {
                    setPassword(result.password);
                    setTempPassword(result.password);
                    setPasswordLoadError(null);
                } else if (!result.success) {
                    // Something is stored but we couldn't decrypt it (keyring locked, format mismatch, etc.)
                    setPasswordLoadError(result.error || 'Could not load saved password — please re-enter it and save.');
                }
            } catch (e) {
                console.error('Failed to load password:', e);
            }
        };
        loadPassword();
    }, []);

    const handleSave = async () => {
        const ipc = (window as any).ipcRenderer;

        // Save config
        updateConfig({ ...config, builderPath, loginName, rememberPassword });

        if (ipc) {
            if (password) {
                // Always make the typed password available for this session.
                setTempPassword(password);

                if (rememberPassword) {
                    const result = await ipc.invoke('save-secure-password', password);
                    if (result.success) {
                        setPasswordSaveStatus(result.encrypted ? '🔐 Password saved securely' : '⚠️ Password saved (not encrypted)');
                        setPasswordLoadError(null);
                    } else {
                        setPasswordSaveStatus('❌ Failed to save password securely');
                    }
                } else {
                    // Not remembering: remove from disk, keep in-session via tempPassword.
                    await ipc.invoke('clear-secure-password');
                    setPasswordSaveStatus('ℹ️ Password active for this session only (not persisted)');
                }
            } else {
                // Password field is empty.
                setTempPassword(null);

                if (passwordLoadError) {
                    // A password exists on disk but couldn't be decrypted this session.
                    // Don't wipe it — the user needs to type a new one to replace it.
                    setPasswordSaveStatus('⚠️ Enter a new password above to replace the unreadable stored one');
                } else {
                    // Nothing to preserve — clear any remnant from disk.
                    await ipc.invoke('clear-secure-password');
                    setPasswordSaveStatus('🗑️ Password cleared');
                }
            }
        }

        setTimeout(() => setPasswordSaveStatus(null), 5000);
    };

    const browseFolder = async () => {
        const ipc = (window as any).ipcRenderer;
        if (!ipc) {
            alert('Cannot open folder picker in browser mode. Please run in Electron.');
            return;
        }
        const path = await ipc.invoke('select-directory');
        if (path) {
            setBuilderPath(path);
            updateConfig({ ...config, builderPath: path, loginName });
        }
    };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-8">
            <div className="max-w-3xl mx-auto text-text-DEFAULT animate-in fade-in duration-300">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-bg-dark p-3 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(255,121,198,0.1)]">
                        <SettingsIcon size={32} className="text-text-muted" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Steam Settings</h2>
                        <p className="text-text-muted">Configure your Steamworks SDK integration</p>
                    </div>
                </div>

                <div className="bg-bg-card border border-white/5 rounded-2xl p-8 shadow-xl space-y-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Steamworks SDK ContentBuilder Path</label>
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={builderPath}
                                    onChange={(e) => setBuilderPath(e.target.value)}
                                    className="w-full bg-bg-main border border-white/10 rounded-lg pl-4 pr-4 py-3 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 font-mono text-sm transition-all"
                                    placeholder="/path/to/sdk/tools/ContentBuilder"
                                />
                            </div>
                            <button
                                onClick={browseFolder}
                                className="bg-white/5 hover:bg-white/10 border border-white/5 px-5 rounded-lg flex items-center justify-center transition-colors text-white"
                            >
                                <FolderOpen size={20} />
                            </button>
                        </div>
                        <p className="text-xs text-text-muted flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block"></span>
                            This folder must contain the <code className="bg-black/30 px-1 rounded border border-white/5">scripts</code> and <code className="bg-black/30 px-1 rounded border border-white/5">content</code> directories.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Steam Username</label>
                        <input
                            type="text"
                            value={loginName}
                            onChange={(e) => setLoginName(e.target.value)}
                            className="w-full bg-bg-main border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 font-semibold transition-all"
                            placeholder="steam_username"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                                Steam Password
                            </label>
                            <div className="flex items-center gap-2">
                                {isEncrypted ? (
                                    <span className="text-[10px] text-green-400 flex items-center gap-1">
                                        <Shield size={12} /> OS Keychain Protected
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-yellow-500 flex items-center gap-1">
                                        <ShieldOff size={12} /> Basic Protection
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-bg-main border border-white/10 rounded-lg pl-10 pr-12 py-3 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 font-semibold transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Remember Password Toggle */}
                        <div className="flex items-center justify-between bg-bg-main/50 rounded-lg px-4 py-3 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded flex items-center justify-center ${rememberPassword ? 'bg-accent' : 'bg-white/10'}`}>
                                    {rememberPassword && <Shield size={12} className="text-white" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">Remember Password</p>
                                    <p className="text-xs text-text-muted">Save password securely for future sessions</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setRememberPassword(!rememberPassword)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${rememberPassword ? 'bg-accent' : 'bg-white/20'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${rememberPassword ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        {passwordLoadError && (
                            <p className="text-xs text-yellow-400 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                                <span>⚠️</span>
                                {passwordLoadError}
                            </p>
                        )}

                        {!rememberPassword && (
                            <p className="text-xs text-blue-400 flex items-center gap-2">
                                <span className="text-blue-400">ℹ️</span>
                                Password will be used for this session only and will NOT be saved to disk.
                            </p>
                        )}

                        {passwordSaveStatus && (
                            <p className="text-xs text-accent animate-in fade-in duration-200">
                                {passwordSaveStatus}
                            </p>
                        )}
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-4">
                        <div className="flex justify-between items-center">
                            {validationStatus && (
                                <div className={`text-sm font-medium px-3 py-1.5 rounded-lg border flex items-center gap-2 ${validationStatus.valid
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}>
                                    {validationStatus.valid ? "✅" : "❌"} {validationStatus.message}
                                </div>
                            )}
                            {!validationStatus && <div />}

                            <button
                                onClick={async () => {
                                    const ipc = (window as any).ipcRenderer;
                                    if (!ipc) {
                                        setValidationStatus({ valid: false, message: "Use Electron app to validate." });
                                        return;
                                    }
                                    const res = await ipc.invoke('validate-config', { ...config, builderPath, loginName });
                                    setValidationStatus(res);
                                }}
                                className="text-accent hover:text-white text-sm font-bold underline decoration-accent/50 hover:decoration-white transition-all"
                            >
                                Test Configuration
                            </button>
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/20 hover:scale-[1.01] active:scale-[0.99]"
                        >
                            <Save size={20} />
                            Save Configuration
                        </button>
                    </div>
                </div>

                {/* About & Updates Section */}
                <AboutSection />
            </div>
        </div>
    );
}

function AboutSection() {
    const [appVersion, setAppVersion] = useState<string>('');
    const [updateStatus, setUpdateStatus] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<{ available: boolean; version?: string } | null>(null);
    const [updateDownloaded, setUpdateDownloaded] = useState(false);

    useEffect(() => {
        const loadVersion = async () => {
            const ipc = (window as any).ipcRenderer;
            if (ipc) {
                const version = await ipc.invoke('get-app-version');
                setAppVersion(version);

                // Listen for update downloaded event
                ipc.on('update-downloaded', () => {
                    setUpdateDownloaded(true);
                    setUpdateStatus('✅ Update downloaded! Click "Install & Restart" to apply.');
                });
            }
        };
        loadVersion();
    }, []);

    const checkForUpdates = async () => {
        const ipc = (window as any).ipcRenderer;
        if (!ipc) {
            setUpdateStatus('❌ Updates only work in Electron app');
            return;
        }

        setIsChecking(true);
        setUpdateStatus('🔍 Checking for updates...');

        try {
            const result = await ipc.invoke('check-for-updates');
            if (result.success) {
                if (result.updateAvailable) {
                    setUpdateInfo({ available: true, version: result.latestVersion });
                    setUpdateStatus(`🎉 Update available: v${result.latestVersion}`);
                } else {
                    setUpdateInfo({ available: false });
                    setUpdateStatus('✅ You have the latest version!');
                }
            } else {
                setUpdateStatus(`⚠️ ${result.error || 'Failed to check for updates'}`);
            }
        } catch (e) {
            setUpdateStatus('❌ Failed to check for updates');
        }

        setIsChecking(false);
        setTimeout(() => setUpdateStatus(null), 5000);
    };

    const downloadUpdate = async () => {
        const ipc = (window as any).ipcRenderer;
        if (!ipc) return;

        setUpdateStatus('📥 Downloading update...');
        const result = await ipc.invoke('download-update');
        if (!result.success) {
            setUpdateStatus(`❌ Download failed: ${result.error}`);
        }
    };

    const installUpdate = async () => {
        const ipc = (window as any).ipcRenderer;
        if (ipc) {
            await ipc.invoke('install-update');
        }
    };

    return (
        <div className="bg-bg-card border border-white/5 rounded-2xl p-6 shadow-xl mt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">About MacPipeGUI</h3>
                    <p className="text-text-muted text-sm">
                        Version <span className="text-accent font-mono">{appVersion || '...'}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {updateInfo?.available && !updateDownloaded && (
                        <button
                            onClick={downloadUpdate}
                            className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Download v{updateInfo.version}
                        </button>
                    )}

                    {updateDownloaded && (
                        <button
                            onClick={installUpdate}
                            className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Install & Restart
                        </button>
                    )}

                    {!updateInfo?.available && (
                        <button
                            onClick={checkForUpdates}
                            disabled={isChecking}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {isChecking ? 'Checking...' : 'Check for Updates'}
                        </button>
                    )}
                </div>
            </div>

            {updateStatus && (
                <div className="mt-4 text-sm text-text-muted animate-in fade-in duration-200">
                    {updateStatus}
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4 text-xs text-text-muted">
                <a
                    href="https://github.com/sakne/MacPipeGUI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent transition-colors"
                >
                    GitHub Repository
                </a>
                <span>•</span>
                <a
                    href="https://github.com/sakne/MacPipeGUI/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent transition-colors"
                >
                    Release Notes
                </a>
                <span>•</span>
                <span>Open Source • GPL-3.0 License</span>
            </div>
        </div>
    );
}
