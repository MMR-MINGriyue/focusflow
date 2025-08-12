import './index.css';
import Home from './pages/index';
import ErrorBoundary from './components/ErrorBoundary';
import { AIDemo } from './components/Timer/AIDemo';
import { ThemeProvider } from './contexts/ThemeContext';

interface AppProps {
  showAIDemo?: boolean;
  onCloseAIDemo?: () => void;
}

function App({ showAIDemo = false, onCloseAIDemo }: AppProps) {
  if (showAIDemo) {
    return (
      <ErrorBoundary>
        <AIDemo onClose={onCloseAIDemo} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
          <Home />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;