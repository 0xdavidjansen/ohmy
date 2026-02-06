import { AppProvider } from './context';
import { useApp } from './hooks';
import {
  UploadTab,
  FlightsTab,
  SummaryTab,
  SettingsTab,
  InfoTab,
  ExportTab,
  WarningBanner,
  ErrorBoundary,
} from './components';
import {
  Upload,
  Plane,
  BarChart3,
  Settings,
  User,
  Download,
} from 'lucide-react';
import type { TabType } from './types';

function TabButton({
  tab,
  label,
  icon: Icon,
  activeTab,
  onClick,
}: {
  tab: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeTab: TabType;
  onClick: (tab: TabType) => void;
}) {
  const isActive = tab === activeTab;
  return (
    <button
      onClick={() => onClick(tab)}
      className={`flex w-full items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all justify-start ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function AppContent() {
  const { state, setTab } = useApp();
  const { activeTab, warnings } = state;

  const dismissibleWarnings = warnings.filter((w) => w.dismissible);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">


      {/* Warning Banners */}
      {dismissibleWarnings.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-4 space-y-2">
          {dismissibleWarnings.slice(0, 3).map((warning) => (
            <WarningBanner key={warning.id} warning={warning} />
          ))}
          {dismissibleWarnings.length > 3 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
              + {dismissibleWarnings.length - 3} weitere Warnungen
            </p>
          )}
        </div>
      )}

      <div className="w-full px-4 pb-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Navigation */}
          <nav className="w-full md:w-[220px] bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm h-fit md:sticky md:top-6">
            <div className="flex flex-col gap-2">
              <TabButton
                tab="upload"
                label="Upload"
                icon={Upload}
                activeTab={activeTab}
                onClick={setTab}
              />
              <TabButton
                tab="settings"
                label="Einstellungen"
                icon={Settings}
                activeTab={activeTab}
                onClick={setTab}
              />
              <TabButton
                tab="flights"
                label="Arbeitstage"
                icon={Plane}
                activeTab={activeTab}
                onClick={setTab}
              />
              <TabButton
                tab="summary"
                label="Übersicht"
                icon={BarChart3}
                activeTab={activeTab}
                onClick={setTab}
              />
              <TabButton
                tab="info"
                label="Info"
                icon={User}
                activeTab={activeTab}
                onClick={setTab}
              />
              <TabButton
                tab="export"
                label="Export"
                icon={Download}
                activeTab={activeTab}
                onClick={setTab}
              />
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 md:pt-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
              <ErrorBoundary>
                {activeTab === 'upload' && <UploadTab />}
                {activeTab === 'flights' && <FlightsTab />}
                {activeTab === 'summary' && <SummaryTab />}
                {activeTab === 'settings' && <SettingsTab />}
                {activeTab === 'info' && <InfoTab />}
                {activeTab === 'export' && <ExportTab />}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>
            Alle Angaben ohne Gewähr. Bitte konsultieren Sie einen Steuerberater
            für verbindliche Auskünfte.
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
