/**
 * 错误提示容器组件
 * 
 * 管理和显示所有的错误提示
 */

import React, { useState, useEffect } from 'react';
import ErrorToast, { errorToastManager } from './ErrorToast';

const ErrorToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    props: any;
  }>>([]);

  useEffect(() => {
    const unsubscribe = errorToastManager.addListener(setToasts);
    return unsubscribe;
  }, []);

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2 pointer-events-none">
      {toasts.map(({ id, props }) => (
        <div key={id} className="pointer-events-auto">
          <ErrorToast {...props} />
        </div>
      ))}
    </div>
  );
};

export default ErrorToastContainer;
