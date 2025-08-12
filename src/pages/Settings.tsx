import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { UnifiedSettings } from '../components/Settings/UnifiedSettings';
import { useUnifiedTimerStoreOptimized } from "../stores/unifiedTimerStoreOptimized";

const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useUnifiedTimerStoreOptimized();

  const handleSettingsChange = (newSettings: any) => {
    updateSettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link to="/" className="flex items-center text-primary hover:text-primary/80">
            <ArrowLeft className="h-5 w-5 mr-2" />
            返回
          </Link>
          <h1 className="text-2xl font-bold ml-4">设置</h1>
        </div>
        <div className="max-w-4xl mx-auto">
          <UnifiedSettings
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;