import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { CalendarView } from './components/CalendarView';
import { InboxView } from './components/InboxView';
import { SettingsView } from './components/SettingsView';
import { CaptureModal } from './components/CaptureModal';
import { AiProcessingModal } from './components/AiProcessingModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { NotificationBanner } from './components/NotificationBanner';
import { OnboardingModal } from './components/OnboardingModal';

const MainLayout: React.FC = () => {
  const { activeTab, settings } = useApp();

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      settings.theme === 'calm_dark' ? 'bg-[#0F2537] text-white' : 'bg-[#F6F8F9] text-[#0F2537]'
    }`}>
      {/* Top Bar Header */}
      <Header />

      {/* Main Content Area based on Active Tab */}
      <main className="max-w-lg mx-auto min-h-[calc(100vh-140px)]">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'inbox' && <InboxView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Global Bottom Navigation */}
      <BottomNav />

      {/* Overlay Modals & Flow Screens */}
      <CaptureModal />
      <AiProcessingModal />
      <TaskDetailModal />
      <NotificationBanner />
      <OnboardingModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
