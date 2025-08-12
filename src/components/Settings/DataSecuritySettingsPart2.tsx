import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { CardDescription } from '../ui/CardDescription';


import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '../ui/Dialog';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import {

  Download,
  Upload,
  Database,

  Trash2,
  RefreshCw,
  AlertCircle,

} from 'lucide-react';
import { getDataSecurityService, BackupInfo } from '../../services/dataSecurityService';

/**
 * 数据安全设置组件 - 第二部分
 * 包含剩余的组件内容
 */

const DataSecuritySettingsPart2: React.FC = () => {
  const [backupList, setBackupList] = useState<BackupInfo[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // 用于文件导入的引用
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const securityService = getDataSecurityService();

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 删除备份
  const handleDeleteBackup = (backupId: string) => {
    setShowDeleteConfirm(backupId);
  };

  // 确认删除备份
  const confirmDeleteBackup = () => {
    if (!showDeleteConfirm) return;

    try {
      securityService.deleteBackup(showDeleteConfirm);
      setBackupList(securityService.getBackupList());
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete backup:', error);
    }
  };

  // 创建备份
  const handleCreateBackup = async () => {
    try {
      await securityService.createBackup();
      setBackupList(securityService.getBackupList());
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  };

  // 导出数据
  const handleExportData = async () => {
    try {
      const data = await securityService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focusflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  // 导入数据
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await securityService.importData(text);
      setBackupList(securityService.getBackupList());
      setImportFile(file);
      // 重置文件输入，以便可以再次选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to import data:', error);
    }
  };

  // 重置所有数据
  const handleResetAllData = () => {
    setShowResetConfirm(true);
  };

  // 确认重置所有数据
  const confirmResetAllData = () => {
    try {
      securityService.resetAllData();
      setBackupList(securityService.getBackupList());
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Failed to reset all data:', error);
    }
  };

  // 加载备份列表
  useEffect(() => {
    setBackupList(securityService.getBackupList());
  }, []);

  return (
    <div className="space-y-6">
      {/* 备份管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            备份管理
          </CardTitle>
          <CardDescription>
            管理您的数据备份，确保数据安全
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-600">
              共有 {backupList.length} 个备份
            </span>
            <div className="flex gap-2">
              <Button onClick={handleCreateBackup} size="sm">
                <RefreshCw className="w-4 h-4 mr-1" />
                创建备份
              </Button>
              <label htmlFor="import-data" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-1" />
                    {importFile ? '更换文件' : '导入数据'}
                  </span>
                </Button>
              </label>
              {importFile && (
                <div className="text-sm text-gray-600 truncate max-w-xs">
                  {importFile.name}
                </div>
              )}
              <input
                id="import-data"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportData}
                ref={fileInputRef}
              />
              <Button onClick={handleExportData} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                导出数据
              </Button>
            </div>
          </div>

          {/* 备份列表 */}
          <div className="space-y-3">
            {backupList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无备份
              </div>
            ) : (
              backupList.map(backup => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {new Date(backup.timestamp).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatFileSize(backup.size)} • 
                      {backup.encrypted ? ' 已加密' : ' 未加密'}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteBackup(backup.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 重置数据 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            重置数据
          </CardTitle>
          <CardDescription>
            警告：此操作将删除所有应用数据，且无法恢复
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                确定要重置所有数据吗？此操作将删除所有设置、统计和备份。
              </p>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>警告</AlertTitle>
                <AlertDescription>
                  此操作不可逆，请确保已备份重要数据。
                </AlertDescription>
              </Alert>
            </div>
            <Button
              variant="destructive"
              onClick={handleResetAllData}
            >
              重置所有数据
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除备份</DialogTitle>
            <DialogDescription>
              您确定要删除此备份吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDeleteBackup}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置确认对话框 */}
      <Dialog open={showResetConfirm} onOpenChange={() => setShowResetConfirm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认重置所有数据</DialogTitle>
            <DialogDescription>
              您确定要重置所有数据吗？此操作将删除所有设置、统计和备份，且无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmResetAllData}>
              重置所有数据
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataSecuritySettingsPart2;