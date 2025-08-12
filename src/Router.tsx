import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import EnhancedWebHome from './pages/EnhancedWebHome';
import { EnhancedAppRouter } from './components/EnhancedAppRouter';
import PerformanceDemo from './pages/PerformanceDemo';
import { WebWorkerDemo } from './components/Timer/WebWorkerDemo';
import { PerformanceComparison } from './components/Timer/PerformanceComparison';
import TimerPage from './pages/TimerPage';
import StatsPage from './pages/StatsPage';
import EnhancedStatsPage from './pages/EnhancedStatsPage';
import EnhancedTimerPage from './pages/EnhancedTimerPage';
import WorldClockPage from './pages/WorldClockPage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import AchievementsPage from './pages/AchievementsPage';


const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/enhanced" element={<EnhancedAppRouter />} />
        <Route path="/timer" element={<TimerPage />} />
        <Route path="/timer/classic" element={<TimerPage mode="classic" />} />
        <Route path="/timer/smart" element={<TimerPage mode="smart" />} />
        <Route path="/timer/custom" element={<TimerPage mode="custom" />} />
        <Route path="/timer/enhanced" element={<EnhancedTimerPage />} />
        <Route path="/timer/enhanced/:mode" element={<EnhancedTimerPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/stats/daily" element={<StatsPage view="daily" />} />
        <Route path="/stats/weekly" element={<StatsPage view="weekly" />} />
        <Route path="/stats/monthly" element={<StatsPage view="monthly" />} />
        <Route path="/stats/enhanced" element={<EnhancedStatsPage />} />
        <Route path="/stats/enhanced/:view" element={<EnhancedStatsPage />} />
        <Route path="/tools/world-clock" element={<WorldClockPage />} />
        <Route path="/tools/settings" element={<SettingsPage />} />
        <Route path="/tools/performance" element={<PerformanceDemo />} />
        <Route path="/tools/performance/demo" element={<PerformanceDemo />} />
        <Route path="/tools/performance/web-worker" element={<WebWorkerDemo />} />
        <Route path="/tools/performance/comparison" element={<PerformanceComparison />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/help/getting-started" element={<HelpPage section="getting-started" />} />
        <Route path="/help/shortcuts" element={<HelpPage section="shortcuts" />} />
        <Route path="/help/faq" element={<HelpPage section="faq" />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/performance-demo" element={<PerformanceDemo />} />
        <Route path="/worker-demo" element={<WebWorkerDemo />} />
        <Route path="/comparison" element={<PerformanceComparison />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;