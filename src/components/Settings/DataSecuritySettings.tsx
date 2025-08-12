import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { CardDescription } from '../ui/CardDescription';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import { 
  Shield, 
  Download, 
  Upload, 
  Database, 
  Clock, 
  Trash2, 
  RefreshCw,
  AlertCircle,

  Calendar,
  HardDrive
} from 'lucide-react';
import { getDataSecurityService, SecurityConfig, SecurityStatus, BackupInfo } from '../../services/dataSecurityService';

/**
 * 数据安全设置组件
 * 提供数据加密、备份和恢复功能
 */
const DataSecuritySettings: React.FC = () => {
  const [config, setConfig] = useState<SecurityConfig>({
    encryptionEnabled: true,
    autoBackup: true,
    backupInterval: 24,
    maxBackups: 5,
    backupLocation: 'local'
  });

  const [status, setStatus] = useState<SecurityStatus>({
    encryptionEnabled: true,
    lastBackupTime: null,
    backupCount: 0,
    securityScore: 85
  });

  const [backupList, setBackupList] = useState<BackupInfo[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isImportingData, setIsImportingData] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [dataStats, setDataStats] = useState({
    totalKeys: 0,
    totalSize: 0,
    encryptedKeys: 0,
    lastBackupTime: null as number | null
  });

  const securityService = getDataSecurityService();

  // 加载配置和状态
  useEffect(() => {
    setConfig(securityService.getConfig());
    setStatus(securityService.getStatus());
    setBackupList(securityService.getBackupList());
    setDataStats(securityService.getDataStats() as any);

    // 添加状态监听器
    const removeListener = securityService.addStatusListener((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      removeListener();
    };
  }, []);

  // 更新配置
  const updateConfig = (newConfig: Partial<SecurityConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    securityService.updateConfig(updatedConfig);
  };

  // 创建备份
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const success = await securityService.createBackup();
      if (success) {
        setBackupList(securityService.getBackupList());
        setStatus(securityService.getStatus());
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // 导出数据
  const handleExportData = async () => {
    setIsExportingData(true);
    try {
      const data = await securityService.exportData();

      // 创建下载链接
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
    } finally {
      setIsExportingData(false);
    }
  };

  // 导入数据
  const handleImportData = async () => {
    if (!importFile) return;

    setIsImportingData(true);
    try {
      const data = await importFile.text();
      const success = await securityService.importData(data);
      if (success) {
        setImportFile(null);
        // 刷新页面以应用新设置
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to import data:', error);
    } finally {
      setIsImportingData(false);
    }
  };

  // 删除备份
  const handleDeleteBackup = (backupId: string) => {
    setShowDeleteConfirm(backupId);
  };

  // 确认删除备份
  const confirmDeleteBackup = () => {
    if (showDeleteConfirm) {
      securityService.deleteBackup(showDeleteConfirm);
      setBackupList(securityService.getBackupList());
      setStatus(securityService.getStatus());
      setShowDeleteConfirm(null);
    }
  };

  // 重置所有数据
  const handleResetAllData = () => {
    setShowResetConfirm(true);
  };

  // 确认重置数据
  const confirmResetAllData = () => {
    securityService.resetAllData();
    setShowResetConfirm(false);
    // 刷新页面以应用重置
    window.location.reload();
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 格式化日期
  const formatDate = (timestamp: number | null): string => {
    if (!timestamp) return '从未';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}小时前`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleDateString();
  };

  // 获取安全评分颜色
  const getSecurityScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            数据安全设置
          </CardTitle>
          <CardDescription>
            管理数据加密、备份和恢复选项
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="security" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="security">安全设置</TabsTrigger>
              <TabsTrigger value="backup">数据备份</TabsTrigger>
              <TabsTrigger value="import-export">导入/导出</TabsTrigger>
            </TabsList>

            {/* 安全设置标签页 */}
            <TabsContent value="security" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">数据加密</div>
                  <div className="text-sm text-muted-foreground">
                    加密存储敏感数据，提高数据安全性
                  </div>
                </div>
                <Switch
                  checked={config.encryptionEnabled}
                  onCheckedChange={(checked) => updateConfig({ encryptionEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">自动备份</div>
                  <div className="text-sm text-muted-foreground">
                    定期自动备份应用数据
                  </div>
                </div>
                <Switch
                  checked={config.autoBackup}
                  onCheckedChange={(checked) => updateConfig({ autoBackup: checked })}
                />
              </div>

              {config.autoBackup && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">备份间隔</div>
                    <select
                      value={config.backupInterval}
                      onChange={(e) => updateConfig({ backupInterval: Number(e.target.value) })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value={1}>1小时</option>
                      <option value={6}>6小时</option>
                      <option value={12}>12小时</option>
                      <option value={24}>24小时</option>
                      <option value={48}>48小时</option>
                      <option value={168}>1周</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">最大备份数量</div>
                    <select
                      value={config.maxBackups}
                      onChange={(e) => updateConfig({ maxBackups: Number(e.target.value) })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value={1}>1个</option>
                      <option value={3}>3个</option>
                      <option value={5}>5个</option>
                      <option value={10}>10个</option>
                      <option value={20}>20个</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">安全评分</div>
                    <div className="text-sm text-muted-foreground">
                      基于当前设置计算的安全评分
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${getSecurityScoreColor(status.securityScore)}`}>
                    {status.securityScore}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center space-x-2 text-sm">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span>{dataStats.totalKeys} 项数据</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span>{formatFileSize(dataStats.totalSize)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>{dataStats.encryptedKeys} 项加密</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(dataStats.lastBackupTime)}</span>
                </div>
              </div>
            </TabsContent>

            {/* 数据备份标签页 */}
            <TabsContent value="backup" className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">数据备份</h3>
                  <p className="text-sm text-muted-foreground">
                    管理您的数据备份，确保数据安全
                  </p>
                </div>
                <Button onClick={handleCreateBackup} disabled={isCreatingBackup}>
                  {isCreatingBackup ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      备份中...
                    </>
                  ) : (
                    '立即备份'
                  )}
                </Button>
              </div>

              {backupList.length > 0 ? (
                <div className="space-y-3">
                  {backupList.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center space-x-3">
                        <Database className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {backup.encrypted ? '加密备份' : '普通备份'}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(backup.timestamp)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <HardDrive className="h-3 w-3" />
                              <span>{formatFileSize(backup.size)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={backup.encrypted ? "default" : "secondary"}>
                          {backup.encrypted ? '加密' : '普通'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBackup(backup.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">暂无备份数据</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    点击"立即备份"按钮创建您的第一个备份
                  </p>
                </div>
              )}
            </TabsContent>

            {/* 导入/导出标签页 */}
            <TabsContent value="import-export" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">数据导出</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  导出您的应用数据，可以在其他设备上恢复
                </p>
                <Button onClick={handleExportData} disabled={isExportingData}>
                  {isExportingData ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      导出中...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      导出数据
                    </>
                  )}
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-medium">数据导入</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  从备份文件恢复您的应用数据
                </p>
                <div className="space-y-4">
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <Button 
                    onClick={handleImportData} 
                    disabled={!importFile || isImportingData}
                  >
                    {isImportingData ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        导入中...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        导入数据
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>注意</AlertTitle>
                <AlertDescription>
                  导入数据将覆盖您当前的所有设置和数据。建议在导入前先导出当前数据作为备份。
                </AlertDescription>
              </Alert>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium text-red-600">危险操作</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  重置所有数据将清除您的所有设置和历史记录，此操作不可恢复
                </p>
                <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" onClick={handleResetAllData}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      重置所有数据
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>确认重置所有数据</DialogTitle>
                      <DialogDescription>
                        此操作将清除您的所有设置和历史记录，包括计时器设置、统计数据和备份。
                        此操作不可恢复，请确保您已备份重要数据。
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
                        取消
                      </Button>
                      <Button variant="destructive" onClick={confirmResetAllData}>
                        确认重置
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 删除备份确认对话框 */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除备份</DialogTitle>
            <DialogDescription>
              此操作将永久删除选定的备份，无法恢复。确定要继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDeleteBackup}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataSecuritySettings;
