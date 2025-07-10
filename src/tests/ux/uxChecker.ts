/**
 * 用户体验自动检查器
 * 自动检测常见的用户体验问题
 */

interface UXIssue {
  type: 'error' | 'warning' | 'info';
  category: 'accessibility' | 'performance' | 'usability' | 'visual';
  message: string;
  element?: Element;
  suggestion?: string;
}

class UXChecker {
  private issues: UXIssue[] = [];

  /**
   * 运行所有UX检查
   */
  async runAllChecks(): Promise<UXIssue[]> {
    this.issues = [];
    
    console.log('🔍 开始用户体验检查...');
    
    this.checkAccessibility();
    this.checkPerformance();
    this.checkUsability();
    this.checkVisualDesign();
    this.checkResponsiveDesign();
    
    await this.checkLoadingTimes();
    
    this.printResults();
    return this.issues;
  }

  /**
   * 检查可访问性
   */
  private checkAccessibility() {
    console.log('🔍 检查可访问性...');
    
    // 检查图片alt属性
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.alt) {
        this.addIssue({
          type: 'warning',
          category: 'accessibility',
          message: '图片缺少alt属性',
          element: img,
          suggestion: '为图片添加描述性的alt属性'
        });
      }
    });

    // 检查按钮文本
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      const text = button.textContent?.trim();
      if (!text || text.length < 2) {
        this.addIssue({
          type: 'warning',
          category: 'accessibility',
          message: '按钮缺少描述性文本',
          element: button,
          suggestion: '为按钮添加清晰的文本描述'
        });
      }
    });

    // 检查颜色对比度
    this.checkColorContrast();

    // 检查焦点指示器
    this.checkFocusIndicators();
  }

  /**
   * 检查性能
   */
  private checkPerformance() {
    console.log('🔍 检查性能...');
    
    // 检查大图片
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.naturalWidth > 2000 || img.naturalHeight > 2000) {
        this.addIssue({
          type: 'warning',
          category: 'performance',
          message: '图片尺寸过大，可能影响加载性能',
          element: img,
          suggestion: '考虑压缩图片或使用响应式图片'
        });
      }
    });

    // 检查内存使用
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      if (usedMB > 100) {
        this.addIssue({
          type: 'warning',
          category: 'performance',
          message: `内存使用较高: ${usedMB.toFixed(2)}MB`,
          suggestion: '检查是否有内存泄漏或优化内存使用'
        });
      }
    }

    // 检查动画性能
    this.checkAnimationPerformance();
  }

  /**
   * 检查可用性
   */
  private checkUsability() {
    console.log('🔍 检查可用性...');
    
    // 检查按钮大小
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      const rect = button.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        this.addIssue({
          type: 'warning',
          category: 'usability',
          message: '按钮尺寸过小，可能难以点击',
          element: button,
          suggestion: '按钮最小尺寸应为44x44px'
        });
      }
    });

    // 检查表单标签
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const id = input.id;
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (!label) {
          this.addIssue({
            type: 'warning',
            category: 'usability',
            message: '表单控件缺少关联的标签',
            element: input,
            suggestion: '为表单控件添加label标签'
          });
        }
      }
    });

    // 检查链接文本
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      const text = link.textContent?.trim();
      if (text && (text === '点击这里' || text === 'click here' || text === '更多')) {
        this.addIssue({
          type: 'info',
          category: 'usability',
          message: '链接文本不够描述性',
          element: link,
          suggestion: '使用更具描述性的链接文本'
        });
      }
    });
  }

  /**
   * 检查视觉设计
   */
  private checkVisualDesign() {
    console.log('🔍 检查视觉设计...');
    
    // 检查字体大小
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
    textElements.forEach(element => {
      const style = window.getComputedStyle(element);
      const fontSize = parseInt(style.fontSize);
      if (fontSize < 14) {
        this.addIssue({
          type: 'warning',
          category: 'visual',
          message: '文字过小，可能影响可读性',
          element: element,
          suggestion: '建议最小字体大小为14px'
        });
      }
    });

    // 检查行高
    textElements.forEach(element => {
      const style = window.getComputedStyle(element);
      const lineHeight = parseFloat(style.lineHeight);
      const fontSize = parseFloat(style.fontSize);
      if (lineHeight / fontSize < 1.2) {
        this.addIssue({
          type: 'info',
          category: 'visual',
          message: '行高过小，可能影响阅读体验',
          element: element,
          suggestion: '建议行高至少为字体大小的1.2倍'
        });
      }
    });
  }

  /**
   * 检查响应式设计
   */
  private checkResponsiveDesign() {
    console.log('🔍 检查响应式设计...');
    
    // 检查视口设置
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      this.addIssue({
        type: 'error',
        category: 'usability',
        message: '缺少viewport meta标签',
        suggestion: '添加viewport meta标签以支持移动设备'
      });
    }

    // 检查水平滚动
    if (document.body.scrollWidth > window.innerWidth) {
      this.addIssue({
        type: 'warning',
        category: 'usability',
        message: '页面出现水平滚动条',
        suggestion: '检查元素宽度设置，确保适应屏幕宽度'
      });
    }
  }

  /**
   * 检查加载时间
   */
  private async checkLoadingTimes(): Promise<void> {
    console.log('🔍 检查加载时间...');
    
    if ('getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        if (loadTime > 3000) {
          this.addIssue({
            type: 'warning',
            category: 'performance',
            message: `页面加载时间过长: ${(loadTime / 1000).toFixed(2)}秒`,
            suggestion: '优化资源加载，减少页面加载时间'
          });
        }
      }
    }
  }

  /**
   * 检查颜色对比度
   */
  private checkColorContrast() {
    // 简化的对比度检查
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, button, a');
    textElements.forEach(element => {
      const style = window.getComputedStyle(element);
      const color = style.color;
      const backgroundColor = style.backgroundColor;
      
      // 如果背景色是透明的，跳过检查
      if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
        return;
      }
      
      // 这里应该实现真正的对比度计算
      // 为了简化，我们只检查是否使用了相似的颜色
      if (color === backgroundColor) {
        this.addIssue({
          type: 'error',
          category: 'accessibility',
          message: '文字颜色与背景颜色相同',
          element: element,
          suggestion: '确保文字与背景有足够的对比度'
        });
      }
    });
  }

  /**
   * 检查焦点指示器
   */
  private checkFocusIndicators() {
    const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
    focusableElements.forEach(element => {
      const style = window.getComputedStyle(element, ':focus');
      if (style.outline === 'none' && !style.boxShadow && !style.border) {
        this.addIssue({
          type: 'warning',
          category: 'accessibility',
          message: '可聚焦元素缺少焦点指示器',
          element: element,
          suggestion: '为可聚焦元素添加明显的焦点指示器'
        });
      }
    });
  }

  /**
   * 检查动画性能
   */
  private checkAnimationPerformance() {
    const animatedElements = document.querySelectorAll('[class*="animate"], [style*="animation"], [style*="transition"]');
    if (animatedElements.length > 10) {
      this.addIssue({
        type: 'info',
        category: 'performance',
        message: '页面包含大量动画元素',
        suggestion: '考虑减少同时进行的动画数量'
      });
    }
  }

  /**
   * 添加问题
   */
  private addIssue(issue: UXIssue) {
    this.issues.push(issue);
  }

  /**
   * 打印结果
   */
  private printResults() {
    console.log('\n📊 用户体验检查结果:');
    
    const errorCount = this.issues.filter(i => i.type === 'error').length;
    const warningCount = this.issues.filter(i => i.type === 'warning').length;
    const infoCount = this.issues.filter(i => i.type === 'info').length;
    
    console.log(`❌ 错误: ${errorCount}`);
    console.log(`⚠️  警告: ${warningCount}`);
    console.log(`ℹ️  信息: ${infoCount}`);
    
    if (this.issues.length === 0) {
      console.log('🎉 没有发现用户体验问题！');
    } else {
      console.log('\n详细问题列表:');
      this.issues.forEach((issue, index) => {
        const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} ${index + 1}. [${issue.category}] ${issue.message}`);
        if (issue.suggestion) {
          console.log(`   💡 建议: ${issue.suggestion}`);
        }
      });
    }
  }

  /**
   * 生成报告
   */
  generateReport(): string {
    const errorCount = this.issues.filter(i => i.type === 'error').length;
    const warningCount = this.issues.filter(i => i.type === 'warning').length;
    const infoCount = this.issues.filter(i => i.type === 'info').length;
    
    let report = '# 用户体验检查报告\n\n';
    report += `## 概要\n`;
    report += `- 错误: ${errorCount}\n`;
    report += `- 警告: ${warningCount}\n`;
    report += `- 信息: ${infoCount}\n`;
    report += `- 总计: ${this.issues.length}\n\n`;
    
    if (this.issues.length > 0) {
      report += '## 问题详情\n\n';
      this.issues.forEach((issue, index) => {
        const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️️' : 'ℹ️';
        report += `### ${icon} 问题 ${index + 1}\n`;
        report += `- **类型**: ${issue.type}\n`;
        report += `- **分类**: ${issue.category}\n`;
        report += `- **描述**: ${issue.message}\n`;
        if (issue.suggestion) {
          report += `- **建议**: ${issue.suggestion}\n`;
        }
        report += '\n';
      });
    }
    
    return report;
  }
}

// 创建全局实例
export const uxChecker = new UXChecker();

// 在浏览器环境中暴露到全局
if (typeof window !== 'undefined') {
  (window as any).uxChecker = uxChecker;
  console.log('用户体验检查器已准备就绪。在浏览器控制台中运行 uxChecker.runAllChecks() 来执行检查。');
}
