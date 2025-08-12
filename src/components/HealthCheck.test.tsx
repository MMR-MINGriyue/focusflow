import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import HealthCheck from './HealthCheck';
import { useHealthCheckStore } from '../../stores/healthCheckStore';
import ErrorToast from './ErrorToast';

// Mock dependencies
vi.mock('../../stores/healthCheckStore');
vi.mock('./ErrorToast', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="error-toast" />)
}));

describe('HealthCheck Component', () => {
  const mockHealthStatus = {
    api: { status: 'ok', responseTime: 45, lastChecked: '2023-10-01T12:00:00Z' },
    database: { status: 'ok', connections: 3, lastChecked: '2023-10-01T12:00:00Z' },
    workers: { status: 'ok', activeWorkers: 2, lastChecked: '2023-10-01T12:00:00Z' },
    sync: { status: 'ok', lastSync: '2023-10-01T11:55:00Z' },
  };

  const mockStore = {
    healthStatus: mockHealthStatus,
    isChecking: false,
    error: null,
    runHealthCheck: vi.fn(),
    enableAutoCheck: vi.fn(),
    disableAutoCheck: vi.fn(),
    autoCheckEnabled: true,
    checkInterval: 300000,
  };

  beforeEach(() => {
    (useHealthCheckStore as jest.Mock).mockReturnValue({
      ...mockStore,
      // Reset mocks before each test
      runHealthCheck: vi.fn(),
      enableAutoCheck: vi.fn(),
      disableAutoCheck: vi.fn(),
    });
    (ErrorToast as jest.Mock).mockClear();
  });

  test('renders health status for all services when healthy', () => {
    render(<HealthCheck />);

    // Verify all services are displayed
    expect(screen.getByText(/API服务/i)).toBeInTheDocument();
    expect(screen.getByText(/数据库/i)).toBeInTheDocument();
    expect(screen.getByText(/Web Workers/i)).toBeInTheDocument();
    expect(screen.getByText(/数据同步/i)).toBeInTheDocument();

    // Verify all statuses are OK
    expect(screen.getAllByText(/正常/i)).toHaveLength(4);
    expect(screen.getByText(/45ms/i)).toBeInTheDocument();
    expect(screen.getByText(/3个连接/i)).toBeInTheDocument();
  });

  test('shows warning status for unhealthy service', () => {
    const degradedStatus = {
      ...mockHealthStatus,
      database: { status: 'degraded', connections: 1, lastChecked: '2023-10-01T12:00:00Z' },
    };

    (useHealthCheckStore as jest.Mock).mockReturnValue({
      ...mockStore,
      healthStatus: degradedStatus,
    });

    render(<HealthCheck />);

    // Verify degraded status is shown
    expect(screen.getByText(/数据库/i)).toBeInTheDocument();
    expect(screen.getByText(/降级/i)).toBeInTheDocument();
    expect(screen.getByText(/1个连接/i)).toBeInTheDocument();
  });

  test('shows error status and toast for failed service', () => {
    const errorStatus = {
      ...mockHealthStatus,
      api: { status: 'error', error: 'Connection timeout', lastChecked: '2023-10-01T12:00:00Z' },
    };

    (useHealthCheckStore as jest.Mock).mockReturnValue({
      ...mockStore,
      healthStatus: errorStatus,
      error: 'API服务连接超时',
    });

    render(<HealthCheck />);

    // Verify error status is shown
    expect(screen.getByText(/API服务/i)).toBeInTheDocument();
    expect(screen.getByText(/错误/i)).toBeInTheDocument();
    expect(screen.getByText(/Connection timeout/i)).toBeInTheDocument();

    // Verify error toast is displayed
    expect(ErrorToast).toHaveBeenCalledWith(expect.objectContaining({
      message: 'API服务连接超时',
      visible: true
    }), expect.anything());
  });

  test('triggers health check when manual check button is clicked', () => {
    const mockRunCheck = vi.fn();
    (useHealthCheckStore as jest.Mock).mockReturnValue({
      ...mockStore,
      runHealthCheck: mockRunCheck,
    });

    render(<HealthCheck />);

    // Click manual check button
    fireEvent.click(screen.getByRole('button', { name: /手动检查/i }));

    expect(mockRunCheck).toHaveBeenCalled();
    expect(screen.getByText(/检查中/i)).toBeInTheDocument();
  });

  test('toggles auto-check when toggle switch is clicked', () => {
    const mockDisable = vi.fn();
    (useHealthCheckStore as jest.Mock).mockReturnValue({
      ...mockStore,
      autoCheckEnabled: true,
      disableAutoCheck: mockDisable,
    });

    render(<HealthCheck />);

    // Click auto-check toggle
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    expect(mockDisable).toHaveBeenCalled();
  });

  test('shows last checked time and next check time when auto-check is enabled', () => {
    (useHealthCheckStore as jest.Mock).mockReturnValue({
      ...mockStore,
      autoCheckEnabled: true,
      lastChecked: '2023-10-01T12:00:00Z',
      nextCheck: '2023-10-01T12:05:00Z',
    });

    render(<HealthCheck />);

    expect(screen.getByText(/上次检查:/i)).toBeInTheDocument();
    expect(screen.getByText(/下次检查:/i)).toBeInTheDocument();
    expect(screen.getByText(/2023-10-01 12:00:00/i)).toBeInTheDocument();
    expect(screen.getByText(/2023-10-01 12:05:00/i)).toBeInTheDocument();
  });

  test('displays retry button when there is an error', () => {
    (useHealthCheckStore as jest.Mock).mockReturnValue({
      ...mockStore,
      error: '健康检查失败',
      healthStatus: {
        ...mockHealthStatus,
        api: { status: 'unknown', lastChecked: null },
      },
    });

    render(<HealthCheck />);

    expect(screen.getByText(/健康检查失败/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument();
  });
});