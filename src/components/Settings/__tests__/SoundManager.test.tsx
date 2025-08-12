/**
 * SoundManager 组件测试
 * 测试音频管理功能、文件上传、播放控制和映射配置
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock dependencies
const mockSoundService = {
  getAllSounds: jest.fn(),
  getSoundMappings: jest.fn(),
  addCustomSound: jest.fn(),
  removeSound: jest.fn(),
  updateSound: jest.fn(),
  setSoundMapping: jest.fn(),
  play: jest.fn(),
  stop: jest.fn(),
  getStorageInfo: jest.fn(),
  exportSounds: jest.fn(),
  importSounds: jest.fn(),
};

jest.mock('../../../services/sound', () => ({
  soundService: mockSoundService,
}));

jest.mock('../../ui/Button', () => ({
  Button: ({ children, onClick, disabled, variant, size, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('../../ui/ConfirmDialog', () => ({
  useConfirmDialog: () => ({
    showConfirmDialog: jest.fn(),
    ConfirmDialog: () => <div data-testid="confirm-dialog">确认对话框</div>,
  })
}));

// Import component after mocks are set up
import SoundManager from '../SoundManager';

describe('SoundManager Component', () => {
  const mockSounds = [
    {
      id: 'sound-1',
      name: '测试音效1',
      description: '测试描述1',
      category: 'notification' as const,
      url: 'blob:test-url-1',
      duration: 2000,
      size: 1024,
    },
    {
      id: 'sound-2', 
      name: '测试音效2',
      description: '测试描述2',
      category: 'ambient' as const,
      url: 'blob:test-url-2',
      duration: 5000,
      size: 2048,
    },
  ];

  const mockMappings = {
    focusStart: 'sound-1',
    breakStart: 'sound-2',
    microBreak: null,
    notification: 'sound-1',
    whiteNoise: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSoundService.getAllSounds.mockReturnValue(mockSounds);
    mockSoundService.getSoundMappings.mockReturnValue(mockMappings);
    mockSoundService.addCustomSound.mockResolvedValue(true);
    mockSoundService.removeSound.mockReturnValue(true);
    mockSoundService.updateSound.mockReturnValue(true);
    mockSoundService.setSoundMapping.mockReturnValue(true);
    mockSoundService.getStorageInfo.mockReturnValue({
      used: 1024,
      total: 10240,
      percentage: 10,
    });
    mockSoundService.exportSounds.mockReturnValue('{"sounds": []}');
    mockSoundService.importSounds.mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
    jest.clearAllTimers();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<SoundManager />);
      expect(screen.getByText('音效管理')).toBeInTheDocument();
    });

    it('displays sound list', () => {
      render(<SoundManager />);
      
      expect(screen.getByText('测试音效1')).toBeInTheDocument();
      expect(screen.getByText('测试音效2')).toBeInTheDocument();
      expect(screen.getByText('测试描述1')).toBeInTheDocument();
    });

    it('shows upload button', () => {
      render(<SoundManager />);
      
      expect(screen.getByText('上传音效')).toBeInTheDocument();
    });

    it('displays event type mappings', () => {
      render(<SoundManager />);
      
      expect(screen.getByText('专注开始')).toBeInTheDocument();
      expect(screen.getByText('休息开始')).toBeInTheDocument();
      expect(screen.getByText('微休息')).toBeInTheDocument();
    });
  });

  describe('Sound Playback', () => {
    it('plays sound when play button is clicked', async () => {
      const user = userEvent.setup();
      render(<SoundManager />);

      const playButton = screen.getAllByTitle('播放')[0];
      await user.click(playButton);

      expect(mockSoundService.play).toHaveBeenCalledWith('sound-1');
    });

    it('stops sound when playing sound is clicked again', async () => {
      const user = userEvent.setup();
      render(<SoundManager />);

      const playButton = screen.getAllByTitle('播放')[0];
      
      // First click to play
      await user.click(playButton);
      expect(mockSoundService.play).toHaveBeenCalledWith('sound-1');

      // Second click to stop
      await user.click(playButton);
      expect(mockSoundService.stop).toHaveBeenCalledWith('sound-1');
    });
  });

  describe('Sound Management', () => {
    it('calls onSoundChange when provided', async () => {
      const mockOnSoundChange = jest.fn();
      const user = userEvent.setup();
      
      render(<SoundManager onSoundChange={mockOnSoundChange} />);

      const playButton = screen.getAllByTitle('播放')[0];
      await user.click(playButton);

      // onSoundChange should be called when sound state changes
      expect(mockOnSoundChange).toHaveBeenCalled();
    });

    it('shows storage info when info button is clicked', async () => {
      const user = userEvent.setup();
      render(<SoundManager />);

      const infoButton = screen.getByTitle('存储信息');
      await user.click(infoButton);

      expect(screen.getByText(/存储使用情况/)).toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    it('handles file upload', async () => {
      const user = userEvent.setup();
      render(<SoundManager />);

      const file = new File(['audio content'], 'test.mp3', { type: 'audio/mp3' });
      const uploadButton = screen.getByText('上传音效');
      
      await user.click(uploadButton);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(mockSoundService.addCustomSound).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles service errors gracefully', () => {
      mockSoundService.getAllSounds.mockImplementation(() => {
        throw new Error('Service error');
      });

      expect(() => render(<SoundManager />)).not.toThrow();
    });
  });
});
