/**
 * 格式化重置计时器的确认对话框消息
 * @param totalSeconds - 总时长（秒）
 * @param timeLeft - 剩余时间（秒）
 * @returns 格式化的确认消息字符串
 */
export function formatConfirmationMessage(totalSeconds: number, timeLeft: number): string {
  const progressLost = totalSeconds - timeLeft;
  const progressMinutes = Math.floor(progressLost / 60);
  const progressSeconds = progressLost % 60;
  
  let progressText = '';
  if (progressMinutes > 0) {
    progressText += `${progressMinutes}分钟`;
  }
  if (progressSeconds > 0) {
    progressText += `${progressMinutes > 0 ? '和' : ''}${progressSeconds}秒`;
  }
  
  // 如果没有具体时间（理论上不会发生），使用默认文本
  if (!progressText) {
    progressText = '少量';
  }
  
  return `确定要重置计时器吗？\n\n当前进度：${progressText}的专注时间将会丢失。\n此操作无法撤销。`;
}

/**
 * 格式化效率评分提交的确认消息
 * @param score - 评分（1-5）
 * @returns 格式化的确认消息字符串
 */
export function formatRatingConfirmationMessage(score: number): string {
  const feedbackTypes = [
    '非常低效',
    '效率较低',
    '一般',
    '比较高效',
    '非常高效'
  ];
  
  // 确保评分在有效范围内
  const clampedScore = Math.max(1, Math.min(5, Math.round(score)));
  const feedback = feedbackTypes[clampedScore - 1];
  
  return `您确定要提交${clampedScore}星评分（${feedback}）吗？\n\n此反馈将用于优化您的专注体验。`;
}