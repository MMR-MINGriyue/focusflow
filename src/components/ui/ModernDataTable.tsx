
/**
 * 现代化数据表格组件
 * 提供丰富的表格功能和交互体验
 */

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Search,
  Filter,
  MoreVertical,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

// 表格列定义
export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

// 表格行操作
export interface TableRowAction<T = any> {
  key: string;
  title: string;
  icon?: React.ReactNode;
  onClick?: (record: T) => void;
  disabled?: (record: T) => boolean;
  className?: string;
}

// 表格分页配置
export interface TablePagination {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  pageSizeOptions?: number[];
  onChange?: (page: number, pageSize: number) => void;
}

// 表格排序配置
export interface TableSorter<T = any> {
  field: keyof T | string;
  order: 'ascend' | 'descend' | null;
}

// 表格筛选配置
export interface TableFilter {
  field: string;
  value: any;
}

interface ModernDataTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  rowKey?: string | ((record: T) => string);
  rowActions?: TableRowAction<T>[];
  pagination?: false | TablePagination;
  loading?: boolean;
  emptyText?: React.ReactNode;
  bordered?: boolean;
  size?: 'small' | 'middle' | 'large';
  showHeader?: boolean;
  scroll?: { x?: string | number; y?: string | number };
  rowSelection?: {
    selectedRowKeys?: string[];
    onChange?: (selectedRowKeys: string[], selectedRows: T[]) => void;
    getCheckboxProps?: (record: T) => { disabled?: boolean; name?: string };
  };
  onSort?: (sorter: TableSorter<T>) => void;
  onFilter?: (filters: TableFilter[]) => void;
  onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
  className?: string;
}

/**
 * 现代化数据表格组件
 */
export function ModernDataTable<T extends Record<string, any>>({
  data,
  columns,
  rowKey = 'id',
  rowActions,
  pagination = {
    current: 1,
    pageSize: 10,
    total: data.length,
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: [10, 20, 50, 100],
  },
  loading = false,
  emptyText = '暂无数据',
  bordered = true,
  size = 'middle',
  showHeader = true,
  scroll,
  rowSelection,
  onSort,
  onFilter,
  onRow,
  className,
}: ModernDataTableProps<T>) {
  const [sorter, setSorter] = useState<TableSorter<T>>({
    field: '',
    order: null,
  });
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>(rowSelection?.selectedRowKeys || []);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(pagination.current);
  const [pageSize, setPageSize] = useState(pagination.pageSize);

  // 处理排序
  const handleSort = (field: keyof T | string) => {
    let newOrder: 'ascend' | 'descend' | null = 'ascend';

    if (sorter.field === field) {
      if (sorter.order === 'ascend') {
        newOrder = 'descend';
      } else if (sorter.order === 'descend') {
        newOrder = null;
      }
    }

    const newSorter: TableSorter<T> = {
      field,
      order: newOrder,
    };

    setSorter(newSorter);
    onSort?.(newSorter);
  };

  // 处理筛选
  const handleFilter = (field: string, value: any) => {
    const newFilters = filters.filter(filter => filter.field !== field);

    if (value !== undefined && value !== null && value !== '') {
      newFilters.push({ field, value });
    }

    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  // 处理搜索
  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    pagination?.onChange?.(page, pageSize);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    pagination?.onChange?.(1, size);
  };

  // 处理行选择
  const handleRowSelect = (key: string, checked: boolean, record: T) => {
    const newSelectedRowKeys = checked
      ? [...selectedRowKeys, key]
      : selectedRowKeys.filter(k => k !== key);

    setSelectedRowKeys(newSelectedRowKeys);

    const selectedRows = data.filter(item => 
      newSelectedRowKeys.includes(typeof rowKey === 'function' ? rowKey(item) : item[rowKey])
    );

    rowSelection?.onChange?.(newSelectedRowKeys, selectedRows);
  };

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelectedRowKeys = data.map(item => 
        typeof rowKey === 'function' ? rowKey(item) : item[rowKey]
      );
      setSelectedRowKeys(newSelectedRowKeys);
      rowSelection?.onChange?.(newSelectedRowKeys, data);
    } else {
      setSelectedRowKeys([]);
      rowSelection?.onChange?.([], []);
    }
  };

  // 数据处理和排序
  const processedData = useMemo(() => {
    let result = [...data];

    // 搜索过滤
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchLower)
        )
      );
    }

    // 列过滤
    filters.forEach(filter => {
      result = result.filter(item => {
        const value = item[filter.field];
        return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
      });
    });

    // 排序
    if (sorter.field && sorter.order) {
      result.sort((a, b) => {
        const aValue = a[sorter.field as keyof T];
        const bValue = b[sorter.field as keyof T];

        if (aValue < bValue) return sorter.order === 'ascend' ? -1 : 1;
        if (aValue > bValue) return sorter.order === 'ascend' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchText, filters, sorter, rowKey]);

  // 分页数据
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return processedData.slice(startIndex, endIndex);
  }, [processedData, currentPage, pageSize, pagination]);

  // 获取尺寸样式
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-sm p-2';
      case 'large':
        return 'text-base p-4';
      case 'middle':
      default:
        return 'text-sm p-3';
    }
  };

  // 渲染表头单元格
  const renderHeaderCell = (column: TableColumn<T>) => {
    const isSortable = column.sortable;
    const isFilterable = column.filterable;
    const isSorted = sorter.field === column.key && sorter.order;

    return (
      <th
        key={column.key as string}
        className={cn(
          'font-medium text-left',
          column.align === 'center' && 'text-center',
          column.align === 'right' && 'text-right',
          column.className
        )}
        style={{ 
          width: column.width, 
          minWidth: column.minWidth,
          maxWidth: column.maxWidth 
        }}
      >
        <div className="flex items-center">
          <span>{column.title}</span>

          <div className="ml-1 flex flex-col">
            {isSortable && (
              <button
                type="button"
                onClick={() => handleSort(column.key)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {isSorted && sorter.order === 'ascend' && (
                  <ChevronUp className="h-3 w-3" />
                )}
                {isSorted && sorter.order === 'descend' && (
                  <ChevronDown className="h-3 w-3" />
                )}
                {!isSorted && (
                  <ChevronDown className="h-3 w-3 opacity-30" />
                )}
              </button>
            )}

            {isFilterable && (
              <button
                type="button"
                onClick={() => handleFilter(column.key as string, '')}
                className="text-gray-400 hover:text-gray-600 focus:outline-none ml-1"
                title="筛选"
                aria-label="筛选"
              >
                <Filter className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </th>
    );
  };

  // 渲染表格单元格
  const renderCell = (column: TableColumn<T>, record: T, index: number) => {
    const value = record[column.key as keyof T];

    if (column.render) {
      return (
        <td
          key={column.key as string}
          className={cn(
            column.align === 'center' && 'text-center',
            column.align === 'right' && 'text-right',
            column.className
          )}
        >
          {column.render(value, record, index)}
        </td>
      );
    }

    return (
      <td
        key={column.key as string}
        className={cn(
          column.align === 'center' && 'text-center',
          column.align === 'right' && 'text-right',
          column.className
        )}
      >
        {value}
      </td>
    );
  };

  // 渲染行操作
  const renderRowActions = (record: T) => {
    if (!rowActions || rowActions.length === 0) return null;

    return (
      <td className="text-right">
        <div className="flex justify-end space-x-2">
          {rowActions.map(action => {
            const disabled = action.disabled?.(record) || false;

            return (
              <button
                key={action.key}
                type="button"
                onClick={() => action.onClick?.(record)}
                disabled={disabled}
                className={cn(
                  'p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700',
                  disabled && 'opacity-50 cursor-not-allowed',
                  action.className
                )}
                title={action.title}
              >
                {action.icon}
              </button>
            );
          })}
        </div>
      </td>
    );
  };

  // 渲染分页器
  const renderPagination = () => {
    if (!pagination) return null;

    const { current, total, showSizeChanger, showQuickJumper, pageSizeOptions = [10, 20, 50, 100] } = pagination;

    const totalPages = Math.ceil(total / pageSize);

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          显示 {((current - 1) * pageSize) + 1} 到 {Math.min(current * pageSize, total)} 条，共 {total} 条
        </div>

        <div className="flex items-center space-x-2">
          {showSizeChanger && (
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-1 pl-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="每页显示条数"
              title="每页显示条数"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size} 条/页
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center">
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={current === 1}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="第一页"
              aria-label="第一页"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => handlePageChange(current - 1)}
              disabled={current === 1}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="上一页"
              aria-label="上一页"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {showQuickJumper && (
              <div className="flex items-center mx-2">
                <span className="text-sm text-gray-700 dark:text-gray-300 mx-1">
                  第
                </span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={current}
                  onChange={(e) => {
                    const page = Math.max(1, Math.min(totalPages, Number(e.target.value)));
                    if (page !== current) {
                      handlePageChange(page);
                    }
                  }}
                  className="w-12 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="页码"
                  title="输入页码"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 mx-1">
                  / {totalPages} 页
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => handlePageChange(current + 1)}
              disabled={current === totalPages}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="下一页"
              aria-label="下一页"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => handlePageChange(totalPages)}
              disabled={current === totalPages}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="最后一页"
              aria-label="最后一页"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 渲染空状态
  const renderEmpty = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={columns.length + (rowActions ? 1 : 0)} className="text-center py-8">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr>
        <td colSpan={columns.length + (rowActions ? 1 : 0)} className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">{emptyText}</div>
        </td>
      </tr>
    );
  };

  // 获取行属性
  const getRowProps = (record: T, index: number) => {
    if (onRow) {
      return onRow(record, index);
    }
    return {};
  };

  return (
    <div className={cn('w-full', className)}>
      {/* 搜索和工具栏 */}
      <div className="flex justify-between items-center mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="搜索..."
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>

        <div className="flex space-x-2">
          <button 
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            title="下载数据"
            aria-label="下载数据"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table
          className={cn(
            'min-w-full divide-y divide-gray-200 dark:divide-gray-700',
            bordered && 'border border-gray-200 dark:border-gray-700',
            getSizeClasses(),
            scroll?.x && `overflow-x-auto [width:${scroll.x}px]`,
            scroll?.y && `overflow-y-auto [max-height:${scroll.y}px]`
          )}
        >
          {showHeader && (
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {rowSelection && (
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedRowKeys.length > 0 && selectedRowKeys.length === data.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                {columns.map(renderHeaderCell)}
                {rowActions && <th className="w-24">操作</th>}
              </tr>
            </thead>
          )}

          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.length > 0 ? (
              paginatedData.map((record, index) => {
                const key = typeof rowKey === 'function' ? rowKey(record) : record[rowKey];
                const isSelected = selectedRowKeys.includes(key);
                const checkboxProps = rowSelection?.getCheckboxProps?.(record) || {};

                return (
                  <tr 
                    key={key} 
                    className={cn(
                      'hover:bg-gray-50 dark:hover:bg-gray-700',
                      isSelected && 'bg-blue-50 dark:bg-blue-900/20'
                    )}
                    {...getRowProps(record, index)}
                  >
                    {rowSelection && (
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleRowSelect(key, e.target.checked, record)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          {...checkboxProps}
                        />
                      </td>
                    )}

                    {columns.map(column => renderCell(column, record, index))}
                    {renderRowActions(record)}
                  </tr>
                );
              })
            ) : (
              renderEmpty()
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {pagination && renderPagination()}
    </div>
  );
}
