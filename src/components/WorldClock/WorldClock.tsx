import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface TimeZone {
  id: string;
  name: string;
  city: string;
  offset: number;
  country: string;
  flag: string;
}

const TIME_ZONES: TimeZone[] = [
  { id: 'UTC', name: '协调世界时', city: 'UTC', offset: 0, country: '全球', flag: '🌍' },
  { id: 'Asia/Shanghai', name: '中国标准时间', city: '北京', offset: 8, country: '中国', flag: '🇨🇳' },
  { id: 'America/New_York', name: '东部标准时间', city: '纽约', offset: -5, country: '美国', flag: '🇺🇸' },
  { id: 'America/Los_Angeles', name: '太平洋标准时间', city: '洛杉矶', offset: -8, country: '美国', flag: '🇺🇸' },
  { id: 'Europe/London', name: '格林威治标准时间', city: '伦敦', offset: 0, country: '英国', flag: '🇬🇧' },
  { id: 'Europe/Paris', name: '欧洲中部时间', city: '巴黎', offset: 1, country: '法国', flag: '🇫🇷' },
  { id: 'Asia/Tokyo', name: '日本标准时间', city: '东京', offset: 9, country: '日本', flag: '🇯🇵' },
  { id: 'Asia/Seoul', name: '韩国标准时间', city: '首尔', offset: 9, country: '韩国', flag: '🇰🇷' },
  { id: 'Australia/Sydney', name: '澳大利亚东部时间', city: '悉尼', offset: 10, country: '澳大利亚', flag: '🇦🇺' },
  { id: 'Pacific/Auckland', name: '新西兰标准时间', city: '奥克兰', offset: 12, country: '新西兰', flag: '🇳🇿' },
];

interface WorldClockProps {
  className?: string;
  compact?: boolean;
  onClose?: () => void;
}

export const WorldClock: React.FC<WorldClockProps> = ({
  className,
  compact = false,
  onClose,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedZones, setSelectedZones] = useState<string[]>(['UTC', 'Asia/Shanghai', 'America/New_York']);
  const [isAddingZone, setIsAddingZone] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getTimeInZone = (timezone: string) => {
    try {
      // 简单时区处理 - 使用偏移量计算
      const zone = TIME_ZONES.find(z => z.id === timezone);
      const offsetHours = zone ? zone.offset : 0;
      
      // 计算时区时间
      const utcTime = currentTime.getTime() + (currentTime.getTimezoneOffset() * 60000);
      const zonedTime = new Date(utcTime + (offsetHours * 3600000));
      
      return {
        time: format(zonedTime, 'HH:mm:ss'),
        date: format(zonedTime, 'yyyy-MM-dd'),
        day: format(zonedTime, 'EEEE'),
      };
    } catch (error) {
      return {
        time: format(currentTime, 'HH:mm:ss'),
        date: format(currentTime, 'yyyy-MM-dd'),
        day: format(currentTime, 'EEEE'),
      };
    }
  };

  const addTimeZone = (zoneId: string) => {
    if (!selectedZones.includes(zoneId)) {
      setSelectedZones([...selectedZones, zoneId]);
    }
    setIsAddingZone(false);
  };

  const removeTimeZone = (zoneId: string) => {
    setSelectedZones(selectedZones.filter(id => id !== zoneId));
  };

  const selectedTimeZones = TIME_ZONES.filter(zone => selectedZones.includes(zone.id));

  if (compact) {
    return (
      <div className={`world-clock-compact ${className}`}>
        <div className="clock-grid">
          {selectedTimeZones.map((zone) => {
            const timeData = getTimeInZone(zone.id);
            return (
              <div key={zone.id} className="clock-item">
                <div className="zone-info">
                  <span className="zone-flag">{zone.flag}</span>
                  <span className="zone-city">{zone.city}</span>
                </div>
                <div className="zone-time">{timeData.time}</div>
                <div className="zone-date">{timeData.date}</div>
              </div>
            );
          })}
        </div>
        <style>{`
          .world-clock-compact {
            padding: 16px;
            background: var(--card);
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .clock-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 12px;
          }
          .clock-item {
            text-align: center;
            padding: 12px;
            background: var(--background);
            border-radius: 8px;
            border: 1px solid var(--border);
          }
          .zone-info {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            margin-bottom: 8px;
          }
          .zone-flag {
            font-size: 16px;
          }
          .zone-city {
            font-size: 12px;
            color: var(--muted-foreground);
            font-weight: 500;
          }
          .zone-time {
            font-size: 18px;
            font-weight: 600;
            font-family: 'Courier New', monospace;
            color: var(--foreground);
          }
          .zone-date {
            font-size: 10px;
            color: var(--muted-foreground);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`world-clock ${className}`}>
      <div className="header">
        <h2>世界时钟</h2>
        <div className="actions">
          <button
            className="add-zone-btn"
            onClick={() => setIsAddingZone(true)}
          >
            ➕ 添加时区
          </button>
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="clock-list">
        {selectedTimeZones.map((zone) => {
          const timeData = getTimeInZone(zone.id);
          return (
            <div key={zone.id} className="clock-card">
              <div className="zone-header">
                <div className="zone-title">
                  <span className="zone-flag">{zone.flag}</span>
                  <div>
                    <div className="zone-name">{zone.name}</div>
                    <div className="zone-location">{zone.city}, {zone.country}</div>
                  </div>
                </div>
                {selectedZones.length > 1 && (
                  <button
                    className="remove-btn"
                    onClick={() => removeTimeZone(zone.id)}
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="time-display">
                <div className="time">{timeData.time}</div>
                <div className="date-info">
                  <span>{timeData.date}</span>
                  <span>{timeData.day}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isAddingZone && (
        <div className="zone-selector">
          <div className="selector-header">
            <h3>选择时区</h3>
            <button className="close-btn" onClick={() => setIsAddingZone(false)}>
              ✕
            </button>
          </div>
          <div className="zone-options">
            {TIME_ZONES.filter(zone => !selectedZones.includes(zone.id)).map((zone) => (
              <div
                key={zone.id}
                className="zone-option"
                onClick={() => addTimeZone(zone.id)}
              >
                <span className="zone-flag">{zone.flag}</span>
                <div>
                  <div className="zone-name">{zone.name}</div>
                  <div className="zone-city">{zone.city}</div>
                </div>
                <span className="zone-offset">
                  UTC{zone.offset >= 0 ? '+' : ''}{zone.offset}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .world-clock {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px;
          background: var(--card);
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }

        .header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: var(--foreground);
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .add-zone-btn, .close-btn {
          padding: 8px 12px;
          border: 1px solid var(--border);
          background: var(--background);
          color: var(--foreground);
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .add-zone-btn:hover, .close-btn:hover {
          background: var(--accent);
        }

        .clock-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .clock-card {
          padding: 20px;
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: 12px;
        }

        .zone-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .zone-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .zone-flag {
          font-size: 24px;
        }

        .zone-name {
          font-weight: 600;
          color: var(--foreground);
          font-size: 16px;
        }

        .zone-location {
          font-size: 14px;
          color: var(--muted-foreground);
        }

        .remove-btn {
          padding: 4px 8px;
          border: none;
          background: var(--destructive);
          color: var(--destructive-foreground);
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .time-display {
          text-align: center;
        }

        .time {
          font-size: 32px;
          font-weight: 700;
          font-family: 'Courier New', monospace;
          color: var(--primary);
          margin-bottom: 8px;
        }

        .date-info {
          display: flex;
          justify-content: center;
          gap: 16px;
          font-size: 14px;
          color: var(--muted-foreground);
        }

        .zone-selector {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }

        .selector-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .zone-options {
          background: var(--card);
          border-radius: 12px;
          padding: 16px;
          max-width: 400px;
          max-height: 60vh;
          overflow-y: auto;
        }

        .zone-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .zone-option:hover {
          background: var(--accent);
        }

        .zone-option .zone-name {
          font-size: 14px;
          font-weight: 500;
        }

        .zone-option .zone-city {
          font-size: 12px;
          color: var(--muted-foreground);
        }

        .zone-offset {
          margin-left: auto;
          font-size: 12px;
          color: var(--muted-foreground);
          font-family: 'Courier New', monospace;
        }

        @media (max-width: 768px) {
          .world-clock {
            padding: 16px;
            margin: 16px;
          }

          .time {
            font-size: 24px;
          }

          .zone-flag {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default WorldClock;