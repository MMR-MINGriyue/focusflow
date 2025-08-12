import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft, HelpCircle, BookOpen, Keyboard, MessageCircle, Clock } from 'lucide-react';
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp';
import OnboardingTour from '../components/OnboardingTour';
import { commonShortcuts } from '../hooks/useKeyboardShortcuts';

interface HelpPageProps {
  section?: 'getting-started' | 'shortcuts' | 'faq';
}

/**
 * 帮助页面组件
 */
const HelpPage: React.FC<HelpPageProps> = ({ section = 'getting-started' }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = React.useState(section);

  const helpSections = [
    { id: 'getting-started', label: '入门指南', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'shortcuts', label: '快捷键', icon: <Keyboard className="w-5 h-5" /> },
    { id: 'faq', label: '常见问题', icon: <MessageCircle className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* 顶部导航 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <HelpCircle className="w-6 h-6 mr-2" />
              帮助中心
            </h1>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* 侧边栏 */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                <nav className="space-y-1">
                  {helpSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id as any)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {section.icon}
                      <span>{section.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* 快速操作 */}
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">快速操作</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/timer')}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    开始计时
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/settings')}
                  >
                    设置
                  </Button>
                </div>
              </div>
            </div>

            {/* 帮助内容 */}
            <div className="lg:col-span-3">
              {activeSection === 'getting-started' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">入门指南</h2>

                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">欢迎使用 FocusFlow</h3>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        FocusFlow 是一款基于番茄工作法的专注计时器应用，帮助您提高工作效率，保持专注。
                        本指南将带您了解如何使用 FocusFlow 的主要功能。
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">基本使用</h3>
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5">
                            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">1</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">选择任务</h4>
                            <p className="text-gray-700 dark:text-gray-300 mt-1">
                              在开始专注前，选择您要完成的任务。将任务写下来可以帮助您更清晰地了解工作目标。
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5">
                            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">2</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">设置计时器</h4>
                            <p className="text-gray-700 dark:text-gray-300 mt-1">
                              默认情况下，FocusFlow 使用25分钟的专注时间和5分钟的休息时间。
                              您可以在设置中调整这些时长以适应您的工作习惯。
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5">
                            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">3</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">开始专注</h4>
                            <p className="text-gray-700 dark:text-gray-300 mt-1">
                              点击"开始"按钮开始专注。在专注期间，尽量避免分心，专注于当前任务。
                              如果有其他想法或任务，可以记录下来，稍后处理。
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5">
                            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">4</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">休息时间</h4>
                            <p className="text-gray-700 dark:text-gray-300 mt-1">
                              当计时器响起时，表示专注时间结束。休息5分钟，让大脑放松。
                              每完成四个番茄钟，休息15-30分钟。
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 mt-0.5">
                            <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">5</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">重复循环</h4>
                            <p className="text-gray-700 dark:text-gray-300 mt-1">
                              重复以上步骤，完成更多任务。每完成一个任务，在您的任务列表上标记它。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">高级功能</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">智能模式</h4>
                          <p className="text-gray-700 dark:text-gray-300">
                            智能模式会根据您的专注状态自动调整工作时长。它会检测您的分心行为，
                            并根据您的反馈优化时间分配，帮助您找到最佳的工作节奏。
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">统计分析</h4>
                          <p className="text-gray-700 dark:text-gray-300">
                            查看您的专注数据，了解您的工作习惯和效率趋势。
                            统计页面会显示您的专注时间、完成番茄数、连续天数等信息。
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">世界时钟</h4>
                          <p className="text-gray-700 dark:text-gray-300">
                            如果您与全球团队合作，世界时钟功能可以帮助您查看不同时区的时间，
                            方便您安排会议和协作。
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">新手引导</h3>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        如果您想更深入地了解 FocusFlow 的功能，可以参加我们的新手引导。
                      </p>
                      <OnboardingTour />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'shortcuts' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">快捷键</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">常用快捷键</h3>
                      <KeyboardShortcutsHelp 
                        shortcuts={Object.entries(commonShortcuts).map(([, shortcut]) => ({
                          key: shortcut.key,
                          description: shortcut.description,
                          action: () => {},
                          displayKey: shortcut.key
                        }))}
                      />
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">快捷键提示</h3>
                      <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                        <li>• 使用快捷键可以大大提高您的工作效率</li>
                        <li>• 大部分快捷键可以在应用的任何地方使用</li>
                        <li>• 如果快捷键与系统快捷键冲突，可以按住 Ctrl 键</li>
                        <li>• 您可以在设置中自定义快捷键</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'faq' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">常见问题</h2>

                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">如何更改专注时长？</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        您可以在设置中更改专注时长。点击导航栏中的"设置"，然后选择"计时器"选项卡。
                        在这里，您可以调整专注时间、短休息时间和长休息时间。
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">数据是否保存在本地？</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        是的，您的所有数据都保存在本地浏览器中。我们不会将您的任何数据发送到服务器。
                        如果您清除浏览器数据，您的专注记录和设置将会丢失。
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">如何导出我的数据？</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        目前，FocusFlow 不支持数据导出功能。我们计划在未来版本中添加此功能。
                        如果您需要备份您的数据，可以定期截图保存您的统计信息。
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">专注时被打断怎么办？</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        如果您在专注时被打断，可以暂停计时器。处理完紧急事务后，
                        再继续您的专注时间。如果中断时间较长，建议重新开始一个番茄钟。
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">如何提高专注效率？</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        提高专注效率需要时间和练习。以下是一些建议：
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 dark:text-gray-300">
                        <li>选择一个安静、舒适的工作环境</li>
                        <li>关闭手机通知和社交媒体</li>
                        <li>准备好水和必要的工具，避免中途离开</li>
                        <li>将大任务分解成小任务，逐个完成</li>
                        <li>休息时真正放松，不要思考工作</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">番茄工作法适合所有人吗？</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        番茄工作法是一种灵活的时间管理方法，适合大多数人和工作类型。
                        但它不是万能的。您可以根据自己的工作习惯和需求进行调整。
                        有些人可能需要更长的专注时间，而有些人可能需要更频繁的休息。
                        关键是找到适合自己的工作节奏。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpPage;
