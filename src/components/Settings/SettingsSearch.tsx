/**
 * 设置搜索和过滤组件
 * 提供高级搜索和过滤功能
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  Star,
  Clock,
  Settings,
  Zap,
  Tag,
  SortAsc,
  SortDesc,
  Grid,
  List,
  ChevronDown
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';

// 搜索过滤器类型
export type SearchFilter = 'all' | 'favorites' | 'recent' | 'modified' | 'experimental' | 'premium';

// 排序类型
export type SortType = 'name' | 'category' | 'modified' | 'default';
export type SortOrder = 'asc' | 'desc';

// 视图类型
export type ViewType = 'grid' | 'list' | 'compact';

// 搜索选项
export interface SearchOptions {
  query: string;
  filter: SearchFilter;
  sortBy: SortType;
  sortOrder: SortOrder;
  viewType: ViewType;
  tags: string[];
  categories: string[];
}

// 组件属性
export interface SettingsSearchProps {
  options: SearchOptions;
  onOptionsChange: (options: SearchOptions) => void;
  availableTags?: string[];
  availableCategories?: string[];
  className?: string;
}

/**
 * 设置搜索组件
 */
export const SettingsSearch: React.FC<SettingsSearchProps> = ({
  options,
  onOptionsChange,
  availableTags = [],
  availableCategories = [],
  className
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // 过滤器选项
  const filterOptions = useMemo(() => [
    { value: 'all', label: '全部', icon: Grid },
    { value: 'favorites', label: '收藏', icon: Star },
    { value: 'recent', label: '最近', icon: Clock },
    { value: 'modified', label: '已修改', icon: Settings },
    { value: 'experimental', label: '实验性', icon: Zap },
    { value: 'premium', label: '高级', icon: Star }
  ], []);

  // 排序选项
  const sortOptions = useMemo(() => [
    { value: 'name', label: '名称' },
    { value: 'category', label: '分类' },
    { value: 'modified', label: '修改时间' },
    { value: 'default', label: '默认' }
  ], []);

  // 视图选项
  const viewOptions = useMemo(() => [
    { value: 'grid', label: '网格', icon: Grid },
    { value: 'list', label: '列表', icon: List },
    { value: 'compact', label: '紧凑', icon: Settings }
  ], []);

  // 更新搜索查询
  const updateQuery = useCallback((query: string) => {
    onOptionsChange({ ...options, query });
  }, [options, onOptionsChange]);

  // 更新过滤器
  const updateFilter = useCallback((filter: SearchFilter) => {
    onOptionsChange({ ...options, filter });
  }, [options, onOptionsChange]);

  // 更新排序
  const updateSort = useCallback((sortBy: SortType, sortOrder?: SortOrder) => {
    onOptionsChange({
      ...options,
      sortBy,
      sortOrder: sortOrder || (options.sortBy === sortBy && options.sortOrder === 'asc' ? 'desc' : 'asc')
    });
  }, [options, onOptionsChange]);

  // 更新视图类型
  const updateViewType = useCallback((viewType: ViewType) => {
    onOptionsChange({ ...options, viewType });
  }, [options, onOptionsChange]);

  // 切换标签
  const toggleTag = useCallback((tag: string) => {
    const newTags = options.tags.includes(tag)
      ? options.tags.filter(t => t !== tag)
      : [...options.tags, tag];
    onOptionsChange({ ...options, tags: newTags });
  }, [options, onOptionsChange]);

  // 切换分类
  const toggleCategory = useCallback((category: string) => {
    const newCategories = options.categories.includes(category)
      ? options.categories.filter(c => c !== category)
      : [...options.categories, category];
    onOptionsChange({ ...options, categories: newCategories });
  }, [options, onOptionsChange]);

  // 清除所有过滤器
  const clearFilters = useCallback(() => {
    onOptionsChange({
      query: '',
      filter: 'all',
      sortBy: 'default',
      sortOrder: 'asc',
      viewType: 'grid',
      tags: [],
      categories: []
    });
  }, [onOptionsChange]);

  // 是否有活动过滤器
  const hasActiveFilters = useMemo(() => {
    return options.query !== '' ||
           options.filter !== 'all' ||
           options.tags.length > 0 ||
           options.categories.length > 0 ||
           options.sortBy !== 'default';
  }, [options]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* 主搜索栏 */}
      <div className="flex items-center gap-3">
        {/* 搜索输入 */}
        <div className={cn(
          'relative flex-1 transition-all duration-200',
          searchFocused && 'scale-[1.02]'
        )}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索设置、描述或标签..."
            value={options.query}
            onChange={(e) => updateQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="pl-10 pr-10"
          />
          {options.query && (
            <button
              onClick={() => updateQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-muted rounded"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* 快速过滤器 */}
        <div className="flex items-center gap-1">
          {filterOptions.slice(0, 4).map(filterOption => {
            const IconComponent = filterOption.icon;
            const isActive = options.filter === filterOption.value;
            return (
              <Button
                key={filterOption.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter(filterOption.value as SearchFilter)}
                className="flex items-center gap-1"
                title={filterOption.label}
              >
                <IconComponent className="h-3 w-3" />
                <span className="hidden sm:inline">{filterOption.label}</span>
              </Button>
            );
          })}
        </div>

        {/* 高级过滤器切换 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">过滤器</span>
          <ChevronDown className={cn(
            'h-3 w-3 transition-transform',
            showAdvancedFilters && 'rotate-180'
          )} />
        </Button>

        {/* 视图切换 */}
        <div className="flex items-center border rounded-md">
          {viewOptions.map(viewOption => {
            const IconComponent = viewOption.icon;
            const isActive = options.viewType === viewOption.value;
            return (
              <button
                key={viewOption.value}
                onClick={() => updateViewType(viewOption.value as ViewType)}
                className={cn(
                  'p-2 transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )}
                title={viewOption.label}
              >
                <IconComponent className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 高级过滤器 */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
              {/* 排序选项 */}
              <div>
                <label className="text-sm font-medium mb-2 block">排序方式</label>
                <div className="flex items-center gap-2">
                  <select
                    value={options.sortBy}
                    onChange={(e) => updateSort(e.target.value as SortType)}
                    className="p-2 border border-input rounded-md bg-background"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSort(options.sortBy, options.sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-1"
                  >
                    {options.sortOrder === 'asc' ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortDesc className="h-4 w-4" />
                    )}
                    {options.sortOrder === 'asc' ? '升序' : '降序'}
                  </Button>
                </div>
              </div>

              {/* 分类过滤 */}
              {availableCategories.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">分类</label>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map(category => {
                      const isSelected = options.categories.includes(category);
                      return (
                        <Button
                          key={category}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleCategory(category)}
                          className="text-xs"
                        >
                          {category}
                          {isSelected && <X className="h-3 w-3 ml-1" />}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 标签过滤 */}
              {availableTags.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">标签</label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => {
                      const isSelected = options.tags.includes(tag);
                      return (
                        <Button
                          key={tag}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleTag(tag)}
                          className="text-xs flex items-center gap-1"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                          {isSelected && <X className="h-3 w-3 ml-1" />}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm text-muted-foreground">
                  {hasActiveFilters ? '已应用过滤器' : '无活动过滤器'}
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    清除过滤器
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 活动过滤器显示 */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">活动过滤器:</span>
          
          {options.filter !== 'all' && (
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
              {filterOptions.find(f => f.value === options.filter)?.label}
            </span>
          )}
          
          {options.tags.map(tag => (
            <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {tag}
              <button onClick={() => toggleTag(tag)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          
          {options.categories.map(category => (
            <span key={category} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1">
              {category}
              <button onClick={() => toggleCategory(category)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SettingsSearch;