import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Clock, Target } from 'lucide-react';

interface EfficiencyRatingProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (score: number) => void;
  duration: number; // 会话时长（分钟）
  type: 'focus' | 'break' | 'microBreak' | 'forcedBreak';
  interruptions?: number; // 中断次数
}

export interface EfficiencyRatingData {
  overallRating: number; // 总体评分 1-5
  focusLevel: number; // 专注程度 1-5
  energyLevel: number; // 精力水平 1-5
  satisfaction: number; // 满意度 1-5
  notes?: string; // 备注
  tags: string[]; // 标签
}

const EfficiencyRating: React.FC<EfficiencyRatingProps> = ({
  isOpen,
  onClose,
  onSubmit,
  duration,
  type,
}) => {
  const [overallRating, setOverallRating] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = () => {
    if (overallRating === 0) {
      alert('请至少给出总体评分');
      return;
    }
    onSubmit(overallRating);
    handleClose();
  };

  const handleClose = () => {
    // 重置表单
    setOverallRating(0);
    setNotes('');
    onClose();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  };

  const getSessionTypeText = (type: string) => {
    switch (type) {
      case 'focus': return '专注会话';
      case 'break': return '休息时间';
      case 'microBreak': return '微休息';
      case 'forcedBreak': return '强制休息';
      default: return '会话';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span>效率评分</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 会话信息 */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {getSessionTypeText(type)}
                </span>
              </div>
              <span className="font-medium">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* 评分区域 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                效率评分 *
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    className={`text-2xl transition-colors ${
                      star <= overallRating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {overallRating > 0 ? `${overallRating}/5` : '请评分'}
                </span>
              </div>
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              备注（可选）
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="记录这次会话的感受、遇到的问题或收获..."
              rows={3}
              className="bg-background border-border"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            跳过
          </Button>
          <Button onClick={handleSubmit}>
            提交评分
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EfficiencyRating;
