import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WebHome from '../pages/WebHome';
import Stats from '../pages/Stats';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WebHome />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;