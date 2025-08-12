import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Music,
  Heart,

  Shuffle,
  Repeat
} from 'lucide-react';

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // 秒
  url: string;
  cover?: string;
  isFavorite?: boolean;
}

interface FocusMusicPlayerProps {
  className?: string;
  autoPlay?: boolean;
  volume?: number;
}

/**
 * 专注音乐播放器组件
 * 帮助用户在专注时播放背景音乐
 */
const FocusMusicPlayer: React.FC<FocusMusicPlayerProps> = ({ 
  className = '',
  autoPlay = false,
  volume = 0.5
}) => {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const [isRepeatOn, setIsRepeatOn] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // 初始化音乐列表
  useEffect(() => {
    // 这里可以替换为实际的音乐数据
    const mockTracks: MusicTrack[] = [
      {
        id: '1',
        title: '专注之音',
        artist: 'FocusFlow',
        album: '专注音乐集',
        duration: 180, // 3分钟
        url: '/music/focus-sound.mp3',
        isFavorite: true
      },
      {
        id: '2',
        title: '深度思考',
        artist: 'FocusFlow',
        album: '专注音乐集',
        duration: 240, // 4分钟
        url: '/music/deep-thinking.mp3'
      },
      {
        id: '3',
        title: '平静湖面',
        artist: 'Nature Sounds',
        album: '自然之声',
        duration: 300, // 5分钟
        url: '/music/calm-lake.mp3'
      },
      {
        id: '4',
        title: '雨滴声',
        artist: 'Nature Sounds',
        album: '自然之声',
        duration: 360, // 6分钟
        url: '/music/raindrops.mp3'
      },
      {
        id: '5',
        title: '森林漫步',
        artist: 'Nature Sounds',
        album: '自然之声',
        duration: 420, // 7分钟
        url: '/music/forest-walk.mp3'
      }
    ];

    setTracks(mockTracks);
  }, []);

  // 获取当前曲目
  const currentTrack = tracks[currentTrackIndex] || null;

  // 播放/暂停控制
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      setIsLoading(true);
      audioRef.current.play()
        .then(() => setIsLoading(false))
        .catch(error => {
          console.error('播放失败:', error);
          setIsLoading(false);
        });
    }

    setIsPlaying(!isPlaying);
  };

  // 播放上一首
  const playPrevious = () => {
    if (tracks.length === 0) return;

    let newIndex;
    if (isShuffleOn) {
      // 随机播放
      newIndex = Math.floor(Math.random() * tracks.length);
      while (newIndex === currentTrackIndex && tracks.length > 1) {
        newIndex = Math.floor(Math.random() * tracks.length);
      }
    } else {
      // 顺序播放
      newIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : tracks.length - 1;
    }

    setCurrentTrackIndex(newIndex);
    setCurrentTime(0);

    // 如果正在播放，自动播放新曲目
    if (isPlaying && audioRef.current) {
      setIsLoading(true);
      audioRef.current.play()
        .then(() => setIsLoading(false))
        .catch(error => {
          console.error('播放失败:', error);
          setIsLoading(false);
        });
    }
  };

  // 播放下一首
  const playNext = () => {
    if (tracks.length === 0) return;

    let newIndex;
    if (isShuffleOn) {
      // 随机播放
      newIndex = Math.floor(Math.random() * tracks.length);
      while (newIndex === currentTrackIndex && tracks.length > 1) {
        newIndex = Math.floor(Math.random() * tracks.length);
      }
    } else {
      // 顺序播放
      newIndex = (currentTrackIndex + 1) % tracks.length;
    }

    setCurrentTrackIndex(newIndex);
    setCurrentTime(0);

    // 如果正在播放，自动播放新曲目
    if (isPlaying && audioRef.current) {
      setIsLoading(true);
      audioRef.current.play()
        .then(() => setIsLoading(false))
        .catch(error => {
          console.error('播放失败:', error);
          setIsLoading(false);
        });
    }
  };

  // 切换静音
  const toggleMute = () => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.volume = currentVolume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // 更新音量
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setCurrentVolume(newVolume);

    if (audioRef.current && !isMuted) {
      audioRef.current.volume = newVolume;
    }
  };



  // 点击进度条跳转
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = offsetX / width;
    const newTime = percentage * (currentTrack?.duration || 0);

    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };

  // 格式化时间（秒转分:秒）
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 切换收藏状态
  const toggleFavorite = () => {
    if (!currentTrack) return;

    setTracks(tracks.map(track => {
      if (track.id === currentTrack.id) {
        return { ...track, isFavorite: !track.isFavorite };
      }
      return track;
    }));
  };

  // 音频事件处理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      if (isRepeatOn) {
        // 重复播放当前曲目
        audio.currentTime = 0;
        audio.play().catch(error => {
          console.error('重复播放失败:', error);
        });
      } else {
        // 播放下一首
        playNext();
      }
    };

    const handleLoadedData = () => {
      setIsLoading(false);
      if (autoPlay) {
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(error => {
            console.error('自动播放失败:', error);
          });
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadeddata', handleLoadedData);

    // 设置初始音量
    audio.volume = currentVolume;

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [autoPlay, currentVolume, isRepeatOn, playNext]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 音频元素（隐藏） */}
      <audio
        ref={audioRef}
        src={currentTrack?.url}
        preload="metadata"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Music className="w-5 h-5 mr-2" />
            专注音乐
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentTrack ? (
            <>
              {/* 当前播放信息 */}
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Music className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {currentTrack.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 truncate">
                    {currentTrack.artist} · {currentTrack.album}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFavorite}
                  className="text-gray-500 hover:text-red-500"
                >
                  <Heart 
                    className={`w-5 h-5 ${currentTrack.isFavorite ? 'fill-red-500 text-red-500' : ''}`} 
                  />
                </Button>
              </div>

              {/* 进度条 */}
              <div className="space-y-2">
                <div
                  ref={progressBarRef}
                  className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
                  onClick={handleProgressBarClick}
                >
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ 
                      width: currentTrack.duration > 0 
                        ? `${(currentTime / currentTrack.duration) * 100}%` 
                        : '0%' 
                    }}
                  ></div>
                </div>
                <div className="flex justify-sm text-gray-600 dark:text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(currentTrack.duration)}</span>
                </div>
              </div>

              {/* 播放控制 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsShuffleOn(!isShuffleOn)}
                    className={isShuffleOn ? 'text-blue-600' : 'text-gray-500'}
                  >
                    <Shuffle className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={playPrevious}
                    className="text-gray-500"
                  >
                    <SkipBack className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={togglePlayPause}
                    size="lg"
                    className="w-12 h-12 rounded-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    ) : isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={playNext}
                    className="text-gray-500"
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsRepeatOn(!isRepeatOn)}
                    className={isRepeatOn ? 'text-blue-600' : 'text-gray-500'}
                  >
                    <Repeat className="w-5 h-5" />
                  </Button>
                </div>

                {/* 音量控制 */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-gray-500"
                  >
                    {isMuted || currentVolume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </Button>
                  <div className="w-24">
                    <Slider
                      value={[isMuted ? 0 : currentVolume]}
                      onValueChange={handleVolumeChange}
                      max={1}
                      step={0.01}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">没有可播放的音乐</p>
            </div>
          )}

          {/* 播放列表 */}
          {tracks.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">播放列表</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      index === currentTrackIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => {
                      setCurrentTrackIndex(index);
                      setCurrentTime(0);
                      if (isPlaying && audioRef.current) {
                        setIsLoading(true);
                        audioRef.current.play()
                          .then(() => setIsLoading(false))
                          .catch(error => {
                            console.error('播放失败:', error);
                            setIsLoading(false);
                          });
                      }
                    }}
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center mr-3">
                      <Music className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <span className={`font-medium truncate ${
                          index === currentTrackIndex ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          {track.title}
                        </span>
                        {track.isFavorite && (
                          <Heart className="w-4 h-4 ml-2 fill-red-500 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {track.artist}
                      </p>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatTime(track.duration)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FocusMusicPlayer;
