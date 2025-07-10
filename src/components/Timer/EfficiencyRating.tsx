import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Rating } from '../ui/Rating';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { Clock, Target } from 'lucide-react';

interface EfficiencyRatingProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: EfficiencyRatingData) => void;
  sessionData: {
    duration: number; // 会话时长（分钟）
    type: 'focus' | 'break' | 'microBreak';
    interruptions?: number; // 中断次数
  };
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
  sessionData,
}) => {
  const [rating, setRating] = useState<EfficiencyRatingData>({
    overallRating: 0,
    focusLevel: 0,
    energyLevel: 0,
    satisfaction: 0,
    notes: '',
    tags: [],
  });

  const predefinedTags = [
    '高效', '分心', '疲劳', '专注', '创造性', '学习',
    '工作', '阅读', '编程', '写作', '思考', '规划'
  ];

  const handleRatingChange = (field: keyof EfficiencyRatingData, value: number) => {
    setRating(prev => ({ ...prev, [field]: value }));
  };

  const handleNotesChange = (notes: string) => {
    setRating(prev => ({ ...prev, notes }));
  };

  const toggleTag = (tag: string) => {
    setRating(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSubmit = () => {
    if (rating.overallRating === 0) {
      alert('请至少给出总体评分');
      return;
    }
    onSubmit(rating);
    handleClose();
  };

  const handleClose = () => {
    // 重置表单
    setRating({
      overallRating: 0,
      focusLevel: 0,
      energyLevel: 0,
      satisfaction: 0,
      notes: '',
      tags: [],
    });
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
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {getSessionTypeText(sessionData.type)}
                </span>
              </div>
              <span className="font-medium">
                {formatDuration(sessionData.duration)}
              </span>
            </div>
          </div>

          {/* 评分区域 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                总体评分 *
              </label>
              <Rating
                value={rating.overallRating}
                onChange={(value) => handleRatingChange('overallRating', value)}
                size="lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                专注程度
              </label>
              <Rating
                value={rating.focusLevel}
                onChange={(value) => handleRatingChange('focusLevel', value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                精力水平
              </label>
              <Rating
                value={rating.energyLevel}
                onChange={(value) => handleRatingChange('energyLevel', value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                满意度
              </label>
              <Rating
                value={rating.satisfaction}
                onChange={(value) => handleRatingChange('satisfaction', value)}
              />
            </div>
          </div>

          {/* 标签选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签
            </label>
            <div className="flex flex-wrap gap-2">
              {predefinedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={rating.tags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-blue-100"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备注（可选）
            </label>
            <Textarea
              value={rating.notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="记录这次会话的感受、遇到的问题或收获..."
              rows={3}
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
