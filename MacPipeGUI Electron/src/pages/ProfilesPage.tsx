import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { AppProfile, DepotConfig } from '../types';
import { Plus, Trash2, Package, Cuboid, AppWindow, Search, CreditCard, FolderOpen } from 'lucide-react';

function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default function ProfilesPage() {
    const profiles = useStore(state => state.profiles);
    const addProfile = useStore(state => state.addProfile);
    const selectProfile = useStore(state => state.selectProfile);
    const selectedProfileId = useStore(state => state.selectedProfileId);
    const deleteProfile = useStore(state => state.deleteProfile);
    const [searchQuery, setSearchQuery] = useState('');

    const handleCreate = () => {
        const newProfile: AppProfile = {
            id: generateId(),
            appName: 'New App Profile',
            appID: '',
            description: '',
            depotProfiles: []
        };
        addProfile(newProfile);
        selectProfile(newProfile.id);
    };

    const selectedProfile = profiles.find(p => p.id === selectedProfileId);

    return (
        <div className="flex h-full bg-bg-main text-text-DEFAULT p-6 gap-6">
            {/* List */}
            <div className="w-[320px] bg-bg-dark rounded-2xl border border-white/5 flex flex-col shadow-xl overflow-hidden shrink-0">
                <div className="p-4 border-b border-white/5 space-y-3 bg-white/5">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                            <CreditCard size={20} className="text-accent" />
                            Profiles
                        </h3>
                        <span className="text-xs text-text-muted bg-bg-main px-2 py-0.5 rounded-full border border-white/5 font-mono">
                            {profiles.length}
                        </span>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 text-text-muted w-4 h-4 group-focus-within:text-accent transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search profiles..."
                            className="w-full bg-bg-main border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 text-white placeholder-text-muted transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {profiles.length > 0 && searchQuery && profiles.filter(p =>
                        p.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.appID.includes(searchQuery)
                    ).length === 0 && (
                        <p className="text-xs text-text-muted text-center py-4">No profiles match "{searchQuery}"</p>
                    )}
                    {profiles.filter(p =>
                        !searchQuery ||
                        p.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.appID.includes(searchQuery)
                    ).map(profile => (
                        <div
                            key={profile.id}
                            onClick={() => selectProfile(profile.id)}
                            className={`group relative w-full text-left px-4 py-3 rounded-xl cursor-pointer transition-all border 
                                ${selectedProfileId === profile.id
                                    ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20'
                                    : 'bg-white/5 border-transparent hover:bg-white/10 text-text-DEFAULT hover:border-white/10'
                                }
                            `}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 
                                     ${selectedProfileId === profile.id ? 'bg-white/20' : 'bg-bg-main text-accent'}`}>
                                    <AppWindow size={20} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className={`font-bold text-sm truncate ${selectedProfileId === profile.id ? 'text-white' : 'text-text-DEFAULT'}`}>
                                        {profile.appName || 'Untitled'}
                                    </h4>
                                    <p className={`text-[10px] mt-0.5 truncate font-mono ${selectedProfileId === profile.id ? 'text-white/80' : 'text-text-muted'}`}>
                                        {profile.appID || 'NO ID'}
                                    </p>
                                </div>
                            </div>

                            {/* Hover Actions */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Delete?')) deleteProfile(profile.id);
                                }}
                                className={`absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity
                                     ${selectedProfileId === profile.id ? 'hover:bg-white/20 text-white' : 'hover:bg-red-500/20 hover:text-red-400 text-text-muted'}
                                `}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}

                    <button onClick={handleCreate} className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-text-muted hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2 font-medium text-xs uppercase tracking-wide bg-white/5 hover:bg-white/10">
                        <Plus size={16} />
                        New Profile
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 bg-bg-dark rounded-2xl border border-white/5 shadow-xl overflow-hidden flex flex-col relative w-full">
                <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-8">
                    {selectedProfile ? (
                        <ProfileEditor key={selectedProfile.id} profile={selectedProfile} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
                            <div className="bg-white/5 p-6 rounded-full mb-6 animate-pulse">
                                <Package size={64} className="opacity-20" />
                            </div>
                            <h2 className="text-xl font-bold mb-2 text-white">No Profile Selected</h2>
                            <p className="text-sm">Select a profile from the sidebar to edit its details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ProfileEditor({ profile }: { profile: AppProfile }) {
    const updateProfile = useStore(state => state.updateProfile);
    const [localProfile, setLocalProfile] = useState<AppProfile>(profile);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setLocalProfile(profile);
        setIsDirty(false);
    }, [profile.id]);

    useEffect(() => {
        if (!isDirty) return;

        const timer = setTimeout(() => {
            updateProfile(localProfile);
            setIsDirty(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [localProfile, isDirty, updateProfile]);

    const handleChange = (field: keyof AppProfile, value: any) => {
        setLocalProfile(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const addDepot = () => {
        const newDepot: DepotConfig = {
            id: generateId(),
            DepotName: 'New Depot',
            DepotID: '',
            ContentRoot: ''
        };
        const updated = {
            ...localProfile,
            depotProfiles: [...localProfile.depotProfiles, newDepot]
        };
        setLocalProfile(updated);
        updateProfile(updated);
    };

    const updateDepot = (index: number, field: keyof DepotConfig, value: string) => {
        const newDepots = [...localProfile.depotProfiles];
        newDepots[index] = { ...newDepots[index], [field]: value };

        setLocalProfile(prev => ({ ...prev, depotProfiles: newDepots }));
        setIsDirty(true);
    };

    const removeDepot = (index: number) => {
        const newDepots = localProfile.depotProfiles.filter((_, i) => i !== index);
        const updated = { ...localProfile, depotProfiles: newDepots };
        setLocalProfile(updated);
        updateProfile(updated);
    };

    const browseDepotPath = async (index: number) => {
        const ipc = (window as any).ipcRenderer;
        if (!ipc) {
            alert('Cannot open folder picker in browser mode.');
            return;
        }
        const path = await ipc.invoke('select-directory');
        if (path) {
            updateDepot(index, 'ContentRoot', path);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="flex items-end gap-6 mb-8">
                <div className="w-24 h-24 bg-accent/10 rounded-2xl flex items-center justify-center border border-accent/20 shadow-[0_0_20px_rgba(255,121,198,0.1)]">
                    <AppWindow size={48} className="text-accent" />
                </div>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{localProfile.appName || 'Untitled App'}</h1>
                    <div className="flex gap-4 text-sm text-text-muted font-medium">
                        <span className="bg-white/5 border border-white/5 px-2 py-1 rounded flex items-center gap-1"><Cuboid size={12} /> App ID: {localProfile.appID || '---'}</span>
                        <span className="bg-white/5 border border-white/5 px-2 py-1 rounded flex items-center gap-1"><Package size={12} /> {localProfile.depotProfiles.length} Depots</span>
                    </div>
                </div>
            </div>

            <div className="bg-bg-card rounded-2xl p-6 border border-white/5 shadow-lg space-y-6">
                <h3 className="text-lg font-bold border-b border-white/5 pb-4 mb-6 flex items-center gap-2">
                    <FolderOpen size={18} className="text-accent" />
                    General Information
                </h3>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Application Name</label>
                        <input
                            type="text"
                            value={localProfile.appName}
                            onChange={(e) => handleChange('appName', e.target.value)}
                            className="w-full bg-bg-main border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all font-medium"
                            placeholder="e.g. My Great Game"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Use App ID</label>
                        <input
                            type="text"
                            value={localProfile.appID}
                            onChange={(e) => handleChange('appID', e.target.value)}
                            className="w-full bg-bg-main border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all font-mono"
                            placeholder="123456"
                        />
                    </div>
                    <div className="col-span-2 space-y-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Description</label>
                        <input
                            type="text"
                            value={localProfile.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="w-full bg-bg-main border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all font-medium"
                            placeholder="Optional build description"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                        Depot Configurations
                    </h3>
                    <button onClick={addDepot} className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-accent/20 transition-all flex items-center gap-2 hover:scale-105 active:scale-95">
                        <Plus size={16} />
                        Add Depot
                    </button>
                </div>

                {localProfile.depotProfiles.map((depot, index) => (
                    <div key={depot.id} className="bg-bg-card border border-white/5 rounded-xl p-5 shadow-md relative group transition-all hover:border-accent/30 hover:shadow-lg">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => removeDepot(index)} className="text-text-muted hover:text-red-400 p-2 transition-colors"><Trash2 size={16} /></button>
                        </div>

                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-1 flex justify-center pt-2">
                                <span className="font-mono text-xs text-text-muted bg-white/5 w-6 h-6 flex items-center justify-center rounded-full border border-white/5">{index + 1}</span>
                            </div>
                            <div className="col-span-11 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-text-muted">Depot Name</label>
                                    <input
                                        value={depot.DepotName}
                                        onChange={(e) => updateDepot(index, 'DepotName', e.target.value)}
                                        className="w-full bg-bg-main border border-white/10 rounded px-3 py-2 text-sm focus:border-accent focus:outline-none transition-colors"
                                        placeholder="Mac Depot"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-text-muted">Depot ID</label>
                                    <input
                                        value={depot.DepotID}
                                        onChange={(e) => updateDepot(index, 'DepotID', e.target.value)}
                                        className="w-full bg-bg-main border border-white/10 rounded px-3 py-2 text-sm focus:border-accent focus:outline-none font-mono transition-colors"
                                        placeholder="123457"
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-text-muted">Content Root Path</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={depot.ContentRoot}
                                            onChange={(e) => updateDepot(index, 'ContentRoot', e.target.value)}
                                            className="flex-1 bg-bg-main border border-white/10 rounded px-3 py-2 text-sm focus:border-accent focus:outline-none font-mono text-xs transition-colors"
                                            placeholder="/path/to/content"
                                        />
                                        <button
                                            onClick={() => browseDepotPath(index)}
                                            className="bg-white/5 hover:bg-white/10 text-white p-2 rounded transition-colors border border-white/5"
                                        >
                                            <FolderOpen size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {localProfile.depotProfiles.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl text-text-muted bg-white/5">
                        <p>No depots configured yet.</p>
                        <button onClick={addDepot} className="text-accent hover:underline text-sm font-medium mt-2">Add your first depot</button>
                    </div>
                )}
            </div>
        </div>
    );
}
