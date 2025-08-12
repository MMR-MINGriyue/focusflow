/**
 * 代码质量检查工具测试
 */

import { codeQualityChecker, checkCodeQuality } from '../codeQualityChecker';

describe('CodeQualityChecker', () => {
  beforeEach(() => {
    codeQualityChecker.clear();
  });

  describe('React Component Checks', () => {
    it('detects unused useState', () => {
      const code = `
        import React, { useState } from 'react';
        
        const Component = () => {
          const [count] = useState(0);
          return <div>Hello</div>;
        };
      `;

      codeQualityChecker.checkReactComponent(code, 'test.tsx');
      const report = codeQualityChecker.generateReport();

      expect(report.issues).toHaveLength(1);
      expect(report.issues[0].message).toContain('未使用的useState');
      expect(report.issues[0].category).toBe('best-practice');
    });

    it('detects missing key in list rendering', () => {
      const code = `
        const items = [1, 2, 3];
        return items.map(item => <div>{item}</div>);
      `;

      codeQualityChecker.checkReactComponent(code, 'test.tsx');
      const report = codeQualityChecker.generateReport();

      expect(report.issues.some(issue => 
        issue.message.includes('缺少key属性')
      )).toBe(true);
    });

    it('detects inline functions and objects', () => {
      const code = `
        return (
          <div 
            onClick={() => console.log('click')}
            style={{ color: 'red' }}
          >
            Content
          </div>
        );
      `;

      codeQualityChecker.checkReactComponent(code, 'test.tsx');
      const report = codeQualityChecker.generateReport();

      expect(report.issues.some(issue => 
        issue.message.includes('内联函数或对象')
      )).toBe(true);
    });

    it('detects missing error handling in async functions', () => {
      const code = `
        const fetchData = async () => {
          const response = await fetch('/api/data');
          return response.json();
        };
      `;

      codeQualityChecker.checkReactComponent(code, 'test.tsx');
      const report = codeQualityChecker.generateReport();

      expect(report.issues.some(issue => 
        issue.message.includes('缺少错误处理')
      )).toBe(true);
    });
  });

  describe('TypeScript Checks', () => {
    it('detects any type usage', () => {
      const code = `
        const data: any = {};
        const result = <any>someValue;
      `;

      codeQualityChecker.checkTypeScript(code, 'test.ts');
      const report = codeQualityChecker.generateReport();

      expect(report.issues.some(issue => 
        issue.message.includes('any类型')
      )).toBe(true);
    });

    it('detects excessive non-null assertions', () => {
      const code = `
        const a = obj!.prop!.value!.data!.item!.name!;
      `;

      codeQualityChecker.checkTypeScript(code, 'test.ts');
      const report = codeQualityChecker.generateReport();

      expect(report.issues.some(issue => 
        issue.message.includes('非空断言操作符')
      )).toBe(true);
    });

    it('detects unused imports', () => {
      const code = `
        import { useState, useEffect, useMemo } from 'react';
        
        const Component = () => {
          const [count, setCount] = useState(0);
          return <div>{count}</div>;
        };
      `;

      codeQualityChecker.checkTypeScript(code, 'test.tsx');
      const report = codeQualityChecker.generateReport();

      expect(report.issues.some(issue => 
        issue.message.includes('未使用的导入')
      )).toBe(true);
    });
  });

  describe('Performance Checks', () => {
    it('detects console statements', () => {
      const code = `
        console.log('debug info');
        console.warn('warning');
      `;

      codeQualityChecker.checkPerformance(code, 'test.ts');
      const report = codeQualityChecker.generateReport();

      expect(report.issues.some(issue => 
        issue.message.includes('console语句')
      )).toBe(true);
    });

    it('detects JSON deep copy', () => {
      const code = `
        const copy = JSON.parse(JSON.stringify(originalObject));
      `;

      codeQualityChecker.checkPerformance(code, 'test.ts');
      const report = codeQualityChecker.generateReport();

      expect(report.issues.some(issue => 
        issue.message.includes('JSON方法进行深拷贝')
      )).toBe(true);
    });

    it('detects localStorage usage', () => {
      const code = `
        const data = localStorage.getItem('key');
        localStorage.setItem('key', 'value');
      `;

      codeQualityChecker.checkPerformance(code, 'test.ts');
      const report = codeQualityChecker.generateReport();

      expect(report.issues.some(issue => 
        issue.message.includes('localStorage操作')
      )).toBe(true);
    });

    it('detects multiple RegExp creations', () => {
      const code = `
        const regex1 = new RegExp('pattern1');
        const regex2 = new RegExp('pattern2');
        const regex3 = new RegExp('pattern3');
        const regex4 = new RegExp('pattern4');
      `;

      codeQualityChecker.checkPerformance(code, 'test.ts');
      const report = codeQualityChecker.generateReport();

      expect(report.issues.some(issue => 
        issue.message.includes('RegExp对象')
      )).toBe(true);
    });
  });

  describe('Security Checks', () => {
    it('detects innerHTML usage', () => {
      const code = `
        element.innerHTML = userInput;
        const jsx = <div dangerouslySetInnerHTML={{__html: content}} />;
      `;

      codeQualityChecker.checkSecurity(code, 'test.ts');
      const report = codeQualityChecker.generateReport();

      expect(report.issues.some(issue => 
        issue.message.includes('innerHTML')
      )).toBe(true);
    });

    it('detects eval usage', () => {
      const code = `
        const result = eval(userCode);
      `;

      codeQualityChecker.checkSecurity(code, 'test.ts');
      const report = codeQualityChecker.generateReport();

      expect(report.issues.some(issue => 
        issue.message.includes('eval()')
      )).toBe(true);
    });

    it('detects hardcoded sensitive information', () => {
      const code = `
        const password = "secret123";
        const apiKey = "abc123def456";
        const secret = "mysecret";
      `;

      codeQualityChecker.checkSecurity(code, 'test.ts');
      const report = codeQualityChecker.generateReport();

      expect(report.issues.some(issue => 
        issue.message.includes('硬编码敏感信息')
      )).toBe(true);
    });
  });

  describe('Maintainability Checks', () => {
    it('detects magic numbers', () => {
      const code = `
        const timeout = 5000;
        const maxRetries = 100;
        const bufferSize = 1024;
      `;

      codeQualityChecker.checkMaintainability(code, 'test.ts');
      const report = codeQualityChecker.generateReport();

      expect(report.issues.some(issue => 
        issue.message.includes('魔法数字')
      )).toBe(true);
    });

    it('detects insufficient comments', () => {
      const longCode = Array(60).fill('const x = 1;').join('\n');

      codeQualityChecker.checkMaintainability(longCode, 'test.ts');
      const report = codeQualityChecker.generateReport();

      expect(report.issues.some(issue => 
        issue.message.includes('注释不足')
      )).toBe(true);
    });
  });

  describe('Report Generation', () => {
    it('generates comprehensive report', () => {
      const code = `
        import { unused } from 'react';
        const data: any = {};
        console.log('debug');
        element.innerHTML = userInput;
      `;

      const report = checkCodeQuality(code, 'test.ts');

      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.summary.total).toBe(report.issues.length);
      expect(report.summary.errors + report.summary.warnings + report.summary.infos).toBe(report.summary.total);
      expect(report.categories).toBeDefined();
      expect(report.timestamp).toBeDefined();
    });

    it('categorizes issues correctly', () => {
      const code = `
        const data: any = {};
        console.log('debug');
      `;

      const report = checkCodeQuality(code, 'test.ts');

      expect(report.categories['type-safety']).toBeGreaterThan(0);
      expect(report.categories['performance']).toBeGreaterThan(0);
    });

    it('identifies auto-fixable issues', () => {
      const code = `
        import { unused } from 'react';
        console.log('debug');
      `;

      codeQualityChecker.checkCode(code, 'test.ts');
      const autoFixable = codeQualityChecker.getAutoFixableIssues();

      expect(autoFixable.length).toBeGreaterThan(0);
      expect(autoFixable.every(issue => issue.autoFixable)).toBe(true);
    });

    it('sorts issues by severity', () => {
      const code = `
        const data: any = {};
        eval(userCode);
        console.log('debug');
      `;

      codeQualityChecker.checkCode(code, 'test.ts');
      const sortedIssues = codeQualityChecker.getIssuesBySeverity();

      // Errors should come first
      const firstError = sortedIssues.find(issue => issue.type === 'error');
      const firstWarning = sortedIssues.find(issue => issue.type === 'warning');
      const firstInfo = sortedIssues.find(issue => issue.type === 'info');

      if (firstError && firstWarning) {
        const errorIndex = sortedIssues.indexOf(firstError);
        const warningIndex = sortedIssues.indexOf(firstWarning);
        expect(errorIndex).toBeLessThan(warningIndex);
      }

      if (firstWarning && firstInfo) {
        const warningIndex = sortedIssues.indexOf(firstWarning);
        const infoIndex = sortedIssues.indexOf(firstInfo);
        expect(warningIndex).toBeLessThan(infoIndex);
      }
    });
  });

  describe('Utility Functions', () => {
    it('clears issues correctly', () => {
      const code = `const data: any = {};`;
      
      codeQualityChecker.checkCode(code, 'test.ts');
      expect(codeQualityChecker.generateReport().issues.length).toBeGreaterThan(0);
      
      codeQualityChecker.clear();
      expect(codeQualityChecker.generateReport().issues.length).toBe(0);
    });

    it('handles empty code', () => {
      const report = checkCodeQuality('', 'test.ts');
      
      expect(report.issues.length).toBe(0);
      expect(report.summary.total).toBe(0);
    });

    it('handles code without issues', () => {
      const code = `
        // Well-written component
        import React, { useState, useCallback } from 'react';
        
        interface Props {
          initialValue: number;
        }
        
        const GoodComponent: React.FC<Props> = ({ initialValue }) => {
          const [count, setCount] = useState(initialValue);
          
          const handleIncrement = useCallback(() => {
            setCount(prev => prev + 1);
          }, []);
          
          return (
            <div>
              <span>Count: {count}</span>
              <button onClick={handleIncrement}>Increment</button>
            </div>
          );
        };
      `;

      const report = checkCodeQuality(code, 'test.tsx');
      
      // Should have minimal or no issues for well-written code
      expect(report.summary.errors).toBe(0);
    });
  });
});
