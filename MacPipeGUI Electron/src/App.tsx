import { useEffect, useState } from 'react';
import { useStore } from './store';
import { LayoutDashboard, Settings, Hammer, Link, Globe, Mail } from 'lucide-react';
import { clsx } from 'clsx';
import ProfilesPage from './pages/ProfilesPage';
import BuildPage from './pages/BuildPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const [activeTab, setActiveTab] = useState<'profiles' | 'build' | 'settings'>('profiles');
  const loadApp = useStore(state => state.loadApp);
  const version = useStore(state => state.version);

  useEffect(() => {
    loadApp();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-bg-main text-text-DEFAULT overflow-hidden select-none font-sans text-sm p-4 gap-4">
      {/* Top Header Card */}
      <div className="bg-bg-dark rounded-2xl p-4 border border-white/5 shadow-lg shrink-0 flex items-center justify-between gap-4">
        {/* Left: Branding */}
        <div className="flex items-center gap-4 min-w-[200px]">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-accent/20 shadow-[0_0_15px_rgba(255,121,198,0.2)]">
            <img src="./app-icon.png" alt="Icon" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">MacPipeGUI Multi</h1>
              <span className="bg-accent/10 text-accent text-[10px] px-2 py-0.5 rounded-full font-mono border border-accent/20">v{version}</span>
            </div>
            <p className="text-text-muted text-xs">Steam Content Deployment Tool</p>
          </div>
        </div>

        {/* Center: Tabs*/}
        <div className="bg-bg-main p-1 rounded-lg border border-white/5 flex gap-1 shadow-inner">
          <TabItem
            icon={<LayoutDashboard size={16} />}
            label="Profiles"
            active={activeTab === 'profiles'}
            onClick={() => setActiveTab('profiles')}
          />
          <TabItem
            icon={<Settings size={16} />}
            label="Steam Settings"
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
          <TabItem
            icon={<Hammer size={16} />}
            label="Build Runner"
            active={activeTab === 'build'}
            onClick={() => setActiveTab('build')}
          />
        </div>

        {/* Right: Credits */}
        <div className="flex flex-col items-end gap-2 min-w-[200px]">
          <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Made with ❤️ by SakneDev</span>
          <div className="flex gap-2">
            <SocialButton icon={<Link size={14} />} label="My Game" href="https://store.steampowered.com/app/3453530/Coffie_Simulator" />
            <SocialButton icon={<Mail size={14} />} label="Email" href="mailto:onebaney@protonmail.com" />
            <SocialButton icon={<Globe size={14} />} label="GitHub" href="https://github.com/sakne" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-bg-dark rounded-2xl border border-white/5 shadow-xl overflow-hidden relative">
        <div className="absolute inset-0">
          {activeTab === 'profiles' && <ProfilesPage />}
          {/* BuildPage is always mounted so build logs and running state survive tab switches */}
          <div className={activeTab === 'build' ? 'h-full' : 'hidden'}><BuildPage /></div>
          {activeTab === 'settings' && <SettingsPage />}
        </div>
      </div>
    </div>
  );
}

function TabItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all duration-200",
        active
          ? "bg-accent/20 text-accent ring-1 ring-accent/50 shadow-lg shadow-accent/10"
          : "text-text-muted hover:text-white hover:bg-white/5"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SocialButton({ icon, label, href }: { icon: any, label: string, href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-text-muted hover:text-white rounded text-xs transition-colors border border-transparent hover:border-white/20"
    >
      {icon}
      <span>{label}</span>
    </a>
  )
}

export default App;
