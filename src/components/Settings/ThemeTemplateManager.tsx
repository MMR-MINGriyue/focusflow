import React from 'react';
import { Theme } from '../../services/themeService';
import { ThemePreview } from './ThemePreview';

interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  theme: Theme;
  tags: string[];
  featured?: boolean;
}

interface ThemeTemplateManagerProps {
  onSelectTemplate: (template: Theme) => void;
  onClose: () => void;
}

const themeTemplates: ThemeTemplate[] = [
  {
    id: 'minimal-light',
    name: '极简白色',
    description: '简洁明亮的白色主题，适合长时间使用',
    category: 'light',
    tags: ['minimal', 'clean', 'professional'],
    featured: true,
    theme: {
      id: 'minimal-light',
      name: '极简白色',
      description: '简洁明亮的白色主题',
      type: 'light',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1f2937',
        textSecondary: '#475569',
        border: '#e5e7eb',
        accent: '#f3f4f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        focus: '#3b82f6',
        break: '#10b981',
        microBreak: '#f59e0b',
        muted: '#9ca3af',
        timer: {
          primary: '#3b82f6',
          secondary: '#64748b',
          accent: '#f3f4f6',
          glow: '#3b82f6'
        }
      },
      fonts: {
          primary: 'Inter, system-ui, sans-serif',
          mono: 'JetBrains Mono, monospace'
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          xxl: '3rem',
          borderRadius: '0.375rem'
        },
        shadows: {
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          glow: '0 0 20px rgba(59, 130, 246, 0.3)'
        },
        animations: {
          duration: '200ms',
          easing: 'ease-out'
        }
    }
  },
  {
    id: 'dark-forest',
    name: '深林夜色',
    description: '深沉的绿色调暗色主题，保护眼睛',
    category: 'dark',
    tags: ['dark', 'green', 'nature'],
    featured: true,
    theme: {
      id: 'dark-forest',
      name: '深林夜色',
      description: '深沉的绿色调暗色主题，保护眼睛',
      type: 'dark',
      colors: {
        primary: '#10b981',
        secondary: '#6b7280',
        background: '#111827',
        surface: '#1f2937',
        text: '#f9fafb',
        textSecondary: '#d1d5db',
        border: '#374151',
        accent: '#1f2937',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
        focus: '#059669',
        break: '#34d399',
        microBreak: '#fbbf24',
        muted: '#4b5563',
        timer: {
          primary: '#10b981',
          secondary: '#6b7280',
          accent: '#1f2937',
          glow: '#10b981'
        }
      },
      fonts: {
        primary: 'Inter, system-ui, sans-serif',
        mono: 'JetBrains Mono, monospace'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        xxl: '3rem',
        borderRadius: '0.375rem'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        glow: '0 0 20px rgba(139, 92, 246, 0.3)'
      },
      animations: {
          duration: '200ms',
          easing: 'ease-out'
        }
    }
  },
  {
    id: 'ocean-blue',
    name: '海洋蓝调',
    description: '清新的蓝色海洋主题，带来宁静感',
    category: 'light',
    tags: ['blue', 'ocean', 'calm'],
    theme: {
      id: 'ocean-blue',
      name: '海洋蓝调',
      description: '清新的蓝色海洋主题',
      type: 'light',
      colors: {
        primary: '#0ea5e9',
        secondary: '#64748b',
        background: '#f0f9ff',
        surface: '#ffffff',
        text: '#0c4a6e',
        textSecondary: '#475569',
        border: '#bae6fd',
        accent: '#e0f2fe',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        focus: '#0284c7',
        break: '#059669',
        microBreak: '#d97706',
        muted: '#94a3b8',
        timer: {
          primary: '#0ea5e9',
          secondary: '#64748b',
          accent: '#e0f2fe',
          glow: '#0ea5e9'
        }
      },
      fonts: {
          primary: 'Inter, system-ui, sans-serif',
          mono: 'JetBrains Mono, monospace'
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          xxl: '3rem',
          borderRadius: '0.375rem'
        },
        shadows: {
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          glow: '0 0 20px rgba(34, 197, 94, 0.3)'
        },
        animations: {
          duration: '200ms',
          easing: 'ease-out'
        }
    }
  },
  {
    id: 'sunset-orange',
    name: '日落橙霞',
    description: '温暖的橙色调主题，充满活力',
    category: 'light',
    tags: ['orange', 'warm', 'energetic'],
    theme: {
      id: 'sunset-orange',
      name: '日落橙霞',
      description: '温暖的橙色调主题',
      type: 'light',
      colors: {
        primary: '#f97316',
        secondary: '#d97706',
        background: '#fff7ed',
        surface: '#ffffff',
        text: '#9a3412',
        textSecondary: '#c2410c',
        border: '#fdba74',
        accent: '#fed7aa',
        success: '#16a34a',
        warning: '#ea580c',
        error: '#dc2626',
        focus: '#ea580c',
        break: '#16a34a',
        microBreak: '#ea580c',
        muted: '#a1a1aa',
        timer: {
          primary: '#f97316',
          secondary: '#d97706',
          accent: '#fed7aa',
          glow: '#f97316'
        }
      },
      fonts: {
          primary: 'Inter, system-ui, sans-serif',
          mono: 'JetBrains Mono, monospace'
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          xxl: '3rem',
          borderRadius: '0.375rem'
        },
        shadows: {
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          glow: '0 0 20px rgba(251, 146, 60, 0.3)'
        },
        animations: {
          duration: '200ms',
          easing: 'ease-out'
        }
    }
  },
  {
    id: 'midnight-purple',
    name: '午夜紫影',
    description: '神秘的紫色暗色主题，充满科技感',
    category: 'dark',
    tags: ['purple', 'dark', 'mystical'],
    theme: {
      id: 'midnight-purple',
      name: '午夜紫影',
      description: '神秘的紫色暗色主题',
      type: 'dark',
      colors: {
        primary: '#8b5cf6',
        secondary: '#a855f7',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f8fafc',
        textSecondary: '#cbd5e1',
        border: '#334155',
        accent: '#312e81',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
        focus: '#7c3aed',
        break: '#34d399',
        microBreak: '#fbbf24',
        muted: '#475569',
        timer: {
          primary: '#8b5cf6',
          secondary: '#a855f7',
          accent: '#312e81',
          glow: '#8b5cf6'
        }
      },
      fonts: {
        primary: 'Inter, system-ui, sans-serif',
        mono: 'JetBrains Mono, monospace'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        xxl: '3rem',
        borderRadius: '0.375rem'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        glow: '0 0 20px rgba(139, 92, 246, 0.3)'
      },
      animations: {
        duration: '200ms',
        easing: 'ease-out'
      }
    }
  },
  {
    id: 'monochrome',
    name: '经典黑白',
    description: '经典的黑白灰配色，永不过时',
    category: 'neutral',
    tags: ['classic', 'monochrome', 'timeless'],
    theme: {
      id: 'monochrome',
      name: '经典黑白',
      description: '经典的黑白灰配色，永不过时',
      type: 'light',
      colors: {
          primary: '#374151',
          secondary: '#f3f4f6',
          background: '#ffffff',
          surface: '#f9fafb',
          text: '#111827',
          textSecondary: '#6b7280',
          border: '#d1d5db',
          accent: '#8b5cf6',
          success: '#22c55e',
          warning: '#f97316',
          error: '#ef4444',
          focus: '#4b5563',
          break: '#22c55e',
          microBreak: '#f97316',
          muted: '#9ca3af',
          timer: {
            primary: '#374151',
            secondary: '#ffffff',
            accent: '#8b5cf6',
            glow: '#374151'
          }
        },
      fonts: {
        primary: 'Inter, system-ui, sans-serif',
        mono: 'JetBrains Mono, monospace'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        xxl: '3rem',
        borderRadius: '0.375rem'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        glow: '0 0 20px rgba(55, 65, 81, 0.3)'
      },
      animations: {
          duration: '200ms',
          easing: 'ease-out'
        }
    }
  }
];

export const ThemeTemplateManager: React.FC<ThemeTemplateManagerProps> = ({
  onSelectTemplate,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState('');

  const categories = [
    { id: 'all', name: '全部', count: themeTemplates.length },
    { id: 'light', name: '亮色', count: themeTemplates.filter(t => t.category === 'light').length },
    { id: 'dark', name: '暗色', count: themeTemplates.filter(t => t.category === 'dark').length },
    { id: 'neutral', name: '中性', count: themeTemplates.filter(t => t.category === 'neutral').length }
  ];

  const filteredTemplates = themeTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredTemplates = themeTemplates.filter(t => t.featured);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">主题模板</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              选择一个预设主题模板作为起点，然后进行自定义调整
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Featured Templates */}
        {featuredTemplates.length > 0 && (
          <div className="p-6 border-b bg-gray-50 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">推荐主题</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredTemplates.map(template => (
                <div
                  key={template.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onSelectTemplate(template.theme)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{template.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                      推荐
                    </span>
                  </div>
                  <div className="mt-3">
                    <ThemePreview theme={template.theme} showDetails={false} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索主题..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={() => onSelectTemplate(template.theme)}
              >
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {template.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {template.description}
                  </p>
                  <div className="mt-3">
                    <ThemePreview theme={template.theme} showDetails={false} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {template.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 dark:bg-gray-900">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              选择主题后，您可以在主题编辑器中进行进一步的自定义调整
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};