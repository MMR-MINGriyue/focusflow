/**
 * 数据备份和恢复组件
 * 提供数据备份、恢复和导入导出功能
 */

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, ConfirmDialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { cn } from '../../utils/cn';
import { 
  Download, 
  Upload, 
  Save, 
  FileText, 
  Calendar, 
  Clock, 
  HardDrive,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react';

// 备份信息类型
export interface BackupInfo {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  size: number; // 字节
  type: 'manual' | 'automatic';
  version: string;
  sessionCount: number;
  focusTime: number; // 秒
  isCorrupted: boolean;
  checksum: string;
}

// 导出格式类型
export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'pdf';

// 导出选项
export interface ExportOptions {
  format: ExportFormat;
  dateRange: {
    start: Date;
    end: Date;
  };
  includeSettings: boolean;
  includeStatistics: boolean;
  includeTags: boolean;
  includeNotes: boolean;
}

/**
 * 数据备份组件
 */
export const DataBackup: React.FC<{
  className?: string;
}> = ({ className }) => {
  const [backups, setBackups] = useState<BackupInfo[]>([
    {
      id: '1',
      name: '自动备份 - 2024-01-15',
      description: '每日自动备份',
      createdAt: new Date('2024-01-15T02:00:00'),
      size: 2048576, // 2MB
      type: 'automatic',
      version: '1.0.0',
      sessionCount: 156,
      focusTime: 18720, // 5.2小时
      isCorrupted: false,
      checksum: 'abc123def456'
    },
    {
      id: '2',
      name: '手动备份 - 重要数据',
      description: '包含所有重要会话数据',
      createdAt: new Date('2024-01-10T14:30:00'),
      size: 3145728, // 3MB
      type: 'manual',
      version: '1.0.0',
      sessionCount: 234,
      focusTime: 28080, // 7.8小时
      isCorrupted: false,
      checksum: 'def456ghi789'
    },
    {
      id: '3',
      name: '自动备份 - 2024-01-08',
      description: '每日自动备份',
      createdAt: new Date('2024-01-08T02:00:00'),
      size: 1572864, // 1.5MB
      type: 'automatic',
      version: '1.0.0',
      sessionCount: 98,
      focusTime: 11760, // 3.27小时
      isCorrupted: true,
      checksum: 'ghi789jkl012'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);
  const [newBackupName, setNewBackupName] = useState('');
  const [newBackupDescription, setNewBackupDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // 创建备份
  const handleCreateBackup = useCallback(async () => {
    if (!newBackupName.trim()) return;

    setLoading(true);
    
    // 模拟备份创建
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newBackup: BackupInfo = {
      id: Date.now().toString(),
      name: newBackupName,
      description: newBackupDescription || undefined,
      createdAt: new Date(),
      size: Math.floor(Math.random() * 5000000) + 1000000, // 1-5MB
      type: 'manual',
      version: '1.0.0',
      sessionCount: Math.floor(Math.random() * 200) + 50,
      focusTime: Math.floor(Math.random() * 36000) + 3600,
      isCorrupted: false,
      checksum: Math.random().toString(36).substring(2, 15)
    };

    setBackups(prev => [newBackup, ...prev]);
    setNewBackupName('');
    setNewBackupDescription('');
    setShowCreateDialog(false);
    setLoading(false);
  }, [newBackupName, newBackupDescription]);

  // 恢复备份
  const handleRestoreBackup = useCallback(async (backup: BackupInfo) => {
    if (!backup) return;

    setLoading(true);
    
    // 模拟恢复过程
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setLoading(false);
    setShowRestoreDialog(false);
    setSelectedBackup(null);
    
    // 显示成功消息
    alert(`成功从备份 "${backup.name}" 恢复数据`);
  }, []);

  // 删除备份
  const handleDeleteBackup = useCallback(async (backup: BackupInfo) => {
    if (!backup) return;

    setLoading(true);
    
    // 模拟删除过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setBackups(prev => prev.filter(b => b.id !== backup.id));
    setLoading(false);
    setShowDeleteDialog(false);
    setSelectedBackup(null);
  }, []);

  // 下载备份
  const handleDownloadBackup = useCallback(async (backup: BackupInfo) => {
    // 模拟下载
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${backup.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // 导入备份
  const handleImportBackup = useCallback(async (file: File) => {
    setLoading(true);
    
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      // 验证备份数据格式
      if (!backupData.name || !backupData.createdAt) {
        throw new Error('无效的备份文件格式');
      }
      
      // 模拟导入过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const importedBackup: BackupInfo = {
        ...backupData,
        id: Date.now().toString(),
        createdAt: new Date(backupData.createdAt),
        type: 'manual' as const
      };
      
      setBackups(prev => [importedBackup, ...prev]);
      alert('备份导入成功');
    } catch (error) {
      alert('备份导入失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 文件选择处理
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImportBackup(file);
    }
    // 清空input值，允许重复选择同一文件
    event.target.value = '';
  }, [handleImportBackup]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* 标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">数据备份</h2>
          <p className="text-muted-foreground">管理您的数据备份和恢复</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.bak"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <Upload className="h-4 w-4 mr-2" />
            导入备份
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            创建备份
          </Button>
        </div>
      </div>

      {/* 备份列表 */}
      <div className="space-y-4">
        {backups.map((backup) => (
          <Card key={backup.id} className={cn(
            'transition-all duration-200',
            backup.isCorrupted && 'border-destructive bg-destructive/5'
          )}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {backup.isCorrupted ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-success" />
                    )}
                    {backup.name}
                    <span className={cn(
                      'px-2 py-1 text-xs rounded-full',
                      backup.type === 'automatic' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                    )}>
                      {backup.type === 'automatic' ? '自动' : '手动'}
                    </span>
                  </CardTitle>
                  {backup.description && (
                    <CardDescription>{backup.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadBackup(backup)}
                    disabled={loading}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedBackup(backup);
                      setShowRestoreDialog(true);
                    }}
                    disabled={loading || backup.isCorrupted}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedBackup(backup);
                      setShowDeleteDialog(true);
                    }}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{backup.createdAt.toLocaleDateString('zh-CN')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span>{formatFileSize(backup.size)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{backup.sessionCount} 会话</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDuration(backup.focusTime)}</span>
                </div>
              </div>
              
              {backup.isCorrupted && (
                <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span>此备份文件已损坏，无法恢复</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {backups.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HardDrive className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无备份</h3>
              <p className="text-muted-foreground text-center mb-4">
                创建您的第一个备份来保护重要数据
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Save className="h-4 w-4 mr-2" />
                创建备份
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 创建备份对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新备份</DialogTitle>
            <DialogDescription>
              为您的专注数据创建一个备份副本
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              label="备份名称"
              placeholder="输入备份名称"
              value={newBackupName}
              onChange={(e) => setNewBackupName(e.target.value)}
              required
            />
            <Input
              label="描述（可选）"
              placeholder="输入备份描述"
              value={newBackupDescription}
              onChange={(e) => setNewBackupDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateBackup}
              disabled={loading || !newBackupName.trim()}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              创建备份
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 恢复备份确认对话框 */}
      <ConfirmDialog
        open={showRestoreDialog}
        onOpenChange={setShowRestoreDialog}
        title="恢复备份"
        description={`确定要从备份 "${selectedBackup?.name}" 恢复数据吗？这将覆盖当前的所有数据。`}
        confirmText="恢复"
        cancelText="取消"
        variant="default"
        loading={loading}
        onConfirm={() => selectedBackup && handleRestoreBackup(selectedBackup)}
      />

      {/* 删除备份确认对话框 */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="删除备份"
        description={`确定要删除备份 "${selectedBackup?.name}" 吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        loading={loading}
        onConfirm={() => selectedBackup && handleDeleteBackup(selectedBackup)}
      />
    </div>
  );
};

export default DataBackup;