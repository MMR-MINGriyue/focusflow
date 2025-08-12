/**
 * 代码质量检查工具
 * 
 * 检测和报告代码质量问题，包括：
 * - 未使用的变量和导入
 * - 代码重复
 * - 性能问题
 * - 类型安全问题
 * - 最佳实践违反
 */

export interface CodeQualityIssue {
  id: string;
  type: 'warning' | 'error' | 'info';
  category: 'performance' | 'type-safety' | 'best-practice' | 'maintainability' | 'security';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  suggestion?: string;
  autoFixable?: boolean;
}

export interface CodeQualityReport {
  issues: CodeQualityIssue[];
  summary: {
    total: number;
    errors: number;
    warnings: number;
    infos: number;
  };
  categories: Record<string, number>;
  timestamp: string;
}

class CodeQualityChecker {
  private issues: CodeQualityIssue[] = [];
  private idCounter = 0;

  private generateId(): string {
    return `cq-${++this.idCounter}`;
  }

  private addIssue(issue: Omit<CodeQualityIssue, 'id'>): void {
    this.issues.push({
      id: this.generateId(),
      ...issue
    });
  }

  /**
   * 检查React组件的常见问题
   */
  checkReactComponent(componentCode: string, fileName?: string): void {
    // 检查未使用的useState
    if (componentCode.includes('useState') && !componentCode.includes('set')) {
      this.addIssue({
        type: 'warning',
        category: 'best-practice',
        message: '检测到可能未使用的useState hook',
        file: fileName,
        suggestion: '确保所有的state都有对应的setter被使用，或考虑使用useRef',
        autoFixable: false
      });
    }

    // 检查未使用的useEffect依赖
    const useEffectMatches = componentCode.match(/useEffect\([^,]+,\s*\[([^\]]*)\]/g);
    if (useEffectMatches) {
      useEffectMatches.forEach(match => {
        const deps = match.match(/\[([^\]]*)\]/)?.[1];
        if (deps && deps.trim() === '') {
          this.addIssue({
            type: 'info',
            category: 'best-practice',
            message: '空依赖数组的useEffect可能应该使用useLayoutEffect或移除依赖数组',
            file: fileName,
            suggestion: '考虑是否真的需要空依赖数组，或者使用useLayoutEffect',
            autoFixable: false
          });
        }
      });
    }

    // 检查内联对象和函数
    if (componentCode.includes('onClick={() =>') || componentCode.includes('style={{')) {
      this.addIssue({
        type: 'warning',
        category: 'performance',
        message: '检测到内联函数或对象，可能导致不必要的重新渲染',
        file: fileName,
        suggestion: '将内联函数和对象提取到组件外部或使用useCallback/useMemo',
        autoFixable: false
      });
    }

    // 检查缺少key的列表渲染
    if (componentCode.includes('.map(') && !componentCode.includes('key=')) {
      this.addIssue({
        type: 'error',
        category: 'best-practice',
        message: '列表渲染缺少key属性',
        file: fileName,
        suggestion: '为每个列表项添加唯一的key属性',
        autoFixable: false
      });
    }

    // 检查未处理的Promise
    if (componentCode.includes('async ') && !componentCode.includes('catch')) {
      this.addIssue({
        type: 'warning',
        category: 'best-practice',
        message: '异步函数可能缺少错误处理',
        file: fileName,
        suggestion: '添加try-catch块或.catch()来处理异步操作的错误',
        autoFixable: false
      });
    }
  }

  /**
   * 检查TypeScript类型安全问题
   */
  checkTypeScript(code: string, fileName?: string): void {
    // 检查any类型的使用
    if (code.includes(': any') || code.includes('<any>')) {
      this.addIssue({
        type: 'warning',
        category: 'type-safety',
        message: '使用了any类型，降低了类型安全性',
        file: fileName,
        suggestion: '尽量使用具体的类型定义或unknown类型',
        autoFixable: false
      });
    }

    // 检查非空断言的过度使用
    const nonNullAssertions = (code.match(/!/g) || []).length;
    if (nonNullAssertions > 5) {
      this.addIssue({
        type: 'warning',
        category: 'type-safety',
        message: '过度使用非空断言操作符(!)',
        file: fileName,
        suggestion: '考虑使用可选链操作符(?.)或添加适当的类型守卫',
        autoFixable: false
      });
    }

    // 检查未使用的导入
    const importMatches = code.match(/import\s+{([^}]+)}\s+from/g);
    if (importMatches) {
      importMatches.forEach(importStatement => {
        const imports = importStatement.match(/{([^}]+)}/)?.[1];
        if (imports) {
          const importList = imports.split(',').map(imp => imp.trim());
          importList.forEach(imp => {
            // 清理导入名称，移除别名
            const cleanImport = imp.replace(/\s+as\s+\w+/, '').trim();
            // 检查导入是否在代码中被使用（排除import语句本身）
            const codeWithoutImports = code.replace(/import\s+.*?from\s+['"][^'"]+['"];?/g, '');
            if (!codeWithoutImports.includes(cleanImport)) {
              this.addIssue({
                type: 'warning',
                category: 'maintainability',
                message: `未使用的导入: ${imp}`,
                file: fileName,
                suggestion: '移除未使用的导入以减少包大小',
                autoFixable: true
              });
            }
          });
        }
      });
    }
  }

  /**
   * 检查性能问题
   */
  checkPerformance(code: string, fileName?: string): void {
    // 检查console.log的使用
    if (code.includes('console.log') || code.includes('console.warn')) {
      this.addIssue({
        type: 'info',
        category: 'performance',
        message: '生产代码中包含console语句',
        file: fileName,
        suggestion: '在生产环境中移除console语句或使用条件日志',
        autoFixable: true
      });
    }

    // 检查大型对象的深拷贝
    if (code.includes('JSON.parse(JSON.stringify(')) {
      this.addIssue({
        type: 'warning',
        category: 'performance',
        message: '使用JSON方法进行深拷贝可能影响性能',
        file: fileName,
        suggestion: '考虑使用专门的深拷贝库如lodash.cloneDeep',
        autoFixable: false
      });
    }

    // 检查同步的localStorage操作
    if (code.includes('localStorage.getItem') || code.includes('localStorage.setItem')) {
      this.addIssue({
        type: 'info',
        category: 'performance',
        message: 'localStorage操作是同步的，可能阻塞主线程',
        file: fileName,
        suggestion: '考虑使用异步存储方案或在Web Worker中处理',
        autoFixable: false
      });
    }

    // 检查未优化的正则表达式
    const regexMatches = code.match(/new RegExp\(/g);
    if (regexMatches && regexMatches.length > 3) {
      this.addIssue({
        type: 'warning',
        category: 'performance',
        message: '多次创建RegExp对象可能影响性能',
        file: fileName,
        suggestion: '将正则表达式定义为常量或使用字面量语法',
        autoFixable: false
      });
    }
  }

  /**
   * 检查安全问题
   */
  checkSecurity(code: string, fileName?: string): void {
    // 检查innerHTML的使用
    if (code.includes('innerHTML') || code.includes('dangerouslySetInnerHTML')) {
      this.addIssue({
        type: 'warning',
        category: 'security',
        message: '使用innerHTML可能导致XSS攻击',
        file: fileName,
        suggestion: '使用textContent或React的安全渲染方法',
        autoFixable: false
      });
    }

    // 检查eval的使用
    if (code.includes('eval(')) {
      this.addIssue({
        type: 'error',
        category: 'security',
        message: '使用eval()存在安全风险',
        file: fileName,
        suggestion: '避免使用eval，寻找替代方案',
        autoFixable: false
      });
    }

    // 检查硬编码的敏感信息
    const sensitivePatterns = [
      /password\s*[:=]\s*['"][^'"]+['"]/i,
      /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
      /secret\s*[:=]\s*['"][^'"]+['"]/i
    ];

    sensitivePatterns.forEach(pattern => {
      if (pattern.test(code)) {
        this.addIssue({
          type: 'error',
          category: 'security',
          message: '检测到可能的硬编码敏感信息',
          file: fileName,
          suggestion: '将敏感信息移至环境变量或配置文件',
          autoFixable: false
        });
      }
    });
  }

  /**
   * 检查可维护性问题
   */
  checkMaintainability(code: string, fileName?: string): void {
    // 检查函数长度
    const functionMatches = code.match(/function\s+\w+[^{]*{[^}]*}/g) || [];
    const arrowFunctionMatches = code.match(/\w+\s*=\s*\([^)]*\)\s*=>\s*{[^}]*}/g) || [];
    
    [...functionMatches, ...arrowFunctionMatches].forEach(func => {
      const lines = func.split('\n').length;
      if (lines > 50) {
        this.addIssue({
          type: 'warning',
          category: 'maintainability',
          message: '函数过长，建议拆分',
          file: fileName,
          suggestion: '将大函数拆分为多个小函数以提高可读性',
          autoFixable: false
        });
      }
    });

    // 检查魔法数字
    const magicNumbers = code.match(/\b\d{3,}\b/g);
    if (magicNumbers && magicNumbers.length > 2) {
      this.addIssue({
        type: 'info',
        category: 'maintainability',
        message: '检测到魔法数字',
        file: fileName,
        suggestion: '将数字常量定义为命名常量',
        autoFixable: false
      });
    }

    // 检查注释密度
    const codeLines = code.split('\n').filter(line => line.trim() && !line.trim().startsWith('//')).length;
    const commentLines = code.split('\n').filter(line => line.trim().startsWith('//')).length;
    const commentRatio = commentLines / codeLines;

    if (commentRatio < 0.1 && codeLines > 50) {
      this.addIssue({
        type: 'info',
        category: 'maintainability',
        message: '代码注释不足',
        file: fileName,
        suggestion: '添加适当的注释来解释复杂的逻辑',
        autoFixable: false
      });
    }
  }

  /**
   * 执行完整的代码质量检查
   */
  checkCode(code: string, fileName?: string): void {
    this.checkReactComponent(code, fileName);
    this.checkTypeScript(code, fileName);
    this.checkPerformance(code, fileName);
    this.checkSecurity(code, fileName);
    this.checkMaintainability(code, fileName);
  }

  /**
   * 生成质量报告
   */
  generateReport(): CodeQualityReport {
    const summary = {
      total: this.issues.length,
      errors: this.issues.filter(issue => issue.type === 'error').length,
      warnings: this.issues.filter(issue => issue.type === 'warning').length,
      infos: this.issues.filter(issue => issue.type === 'info').length
    };

    const categories = this.issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      issues: [...this.issues],
      summary,
      categories,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 清除所有问题
   */
  clear(): void {
    this.issues = [];
    this.idCounter = 0;
  }

  /**
   * 获取可自动修复的问题
   */
  getAutoFixableIssues(): CodeQualityIssue[] {
    return this.issues.filter(issue => issue.autoFixable);
  }

  /**
   * 按严重程度排序问题
   */
  getIssuesBySeverity(): CodeQualityIssue[] {
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return [...this.issues].sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);
  }
}

// 导出单例实例
export const codeQualityChecker = new CodeQualityChecker();

// 便捷函数
export const checkCodeQuality = (code: string, fileName?: string): CodeQualityReport => {
  codeQualityChecker.clear();
  codeQualityChecker.checkCode(code, fileName);
  return codeQualityChecker.generateReport();
};
