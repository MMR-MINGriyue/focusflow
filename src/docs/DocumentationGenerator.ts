/**
 * 文档生成器
 * 用于生成项目文档
 */

/**
 * 文档类型
 */
export enum DocumentType {
  API = 'api',
  GUIDE = 'guide',
  TUTORIAL = 'tutorial',
  EXAMPLE = 'example',
  REFERENCE = 'reference',
}

/**
 * 文档元数据
 */
export interface DocumentMetadata {
  title: string;
  description: string;
  type: DocumentType;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  author: string;
  version: string;
}

/**
 * 文档
 */
export interface Document {
  id: string;
  content: string;
  metadata: DocumentMetadata;
}

/**
 * 文档生成器配置
 */
export interface DocumentationGeneratorOptions {
  outputDir: string;
  projectName: string;
  projectVersion: string;
  author: string;
}

/**
 * 文档生成器
 */
export class DocumentationGenerator {
  private documents = new Map<string, Document>();
  private options: DocumentationGeneratorOptions;

  constructor(options: DocumentationGeneratorOptions) {
    this.options = options;
  }

  /**
   * 添加文档
   * @param document 文档
   */
  addDocument(document: Document): void {
    this.documents.set(document.id, document);
  }

  /**
   * 获取文档
   * @param id 文档ID
   */
  getDocument(id: string): Document | undefined {
    return this.documents.get(id);
  }

  /**
   * 生成所有文档
   */
  generateAll(): string {
    const documents = Array.from(this.documents.values());
    
    let html = this.generateHeader();
    html += this.generateNavigation();
    html += '<main class="main-content">';
    
    // 生成首页
    html += this.generateIndex();
    
    // 生成文档列表
    html += this.generateDocumentList(documents);
    
    html += '</main>';
    html += this.generateFooter();
    
    return html;
  }

  /**
   * 生成HTML头部
   */
  private generateHeader(): string {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.options.projectName} - 文档</title>
    <meta name="description" content="${this.options.projectName} 项目文档">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <h1>${this.options.projectName} 文档</h1>
            <p>版本 ${this.options.projectVersion}</p>
        </div>
    </header>
    `;
  }

  /**
   * 生成导航
   */
  private generateNavigation(): string {
    return `
    <nav class="navigation">
        <div class="container">
            <ul>
                <li><a href="#overview">概览</a></li>
                <li><a href="#api">API 参考</a></li>
                <li><a href="#guides">使用指南</a></li>
                <li><a href="#examples">示例</a></li>
            </ul>
        </div>
    </nav>
    `;
  }

  /**
   * 生成页脚
   */
  private generateFooter(): string {
    return `
    <footer class="footer">
        <div class="container">
            <p>&copy; ${new Date().getFullYear()} ${this.options.author}. All rights reserved.</p>
            <p>版本 ${this.options.projectVersion}</p>
        </div>
    </footer>
</body>
</html>
    `;
  }

  /**
   * 生成首页
   */
  private generateIndex(): string {
    return `
    <section id="overview" class="section">
        <div class="container">
            <h2>项目概览</h2>
            <p>欢迎使用 ${this.options.projectName} 项目文档。</p>
            
            <div class="quick-links">
                <h3>快速开始</h3>
                <ul>
                    <li><a href="#installation">安装指南</a></li>
                    <li><a href="#quickstart">快速入门</a></li>
                    <li><a href="#api-docs">API 文档</a></li>
                </ul>
            </div>
        </div>
    </section>
    `;
  }

  /**
   * 生成文档列表
   */
  private generateDocumentList(documents: Document[]): string {
    const grouped = this.groupDocumentsByType(documents);
    
    let html = '';
    
    for (const [type, docs] of grouped) {
      html += `
      <section id="${type}" class="section">
          <div class="container">
              <h2>${this.getTypeTitle(type)}</h2>
              <div class="document-list">
      `;
      
      for (const doc of docs) {
        html += this.generateDocumentCard(doc);
      }
      
      html += `
              </div>
          </div>
      </section>
      `;
    }
    
    return html;
  }

  /**
   * 生成文档卡片
   */
  private generateDocumentCard(document: Document): string {
    return `
    <div class="document-card">
        <h3>${document.metadata.title}</h3>
        <p>${document.metadata.description}</p>
        <div class="meta">
            <span class="type">${document.metadata.type}</span>
            <span class="author">${document.metadata.author}</span>
            <span class="date">${document.metadata.updatedAt.toLocaleDateString()}</span>
        </div>
        <div class="tags">
            ${document.metadata.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
    </div>
    `;
  }

  /**
   * 按类型分组文档
   */
  private groupDocumentsByType(documents: Document[]): Map<DocumentType, Document[]> {
    const grouped = new Map<DocumentType, Document[]>();
    
    for (const doc of documents) {
      if (!grouped.has(doc.metadata.type)) {
        grouped.set(doc.metadata.type, []);
      }
      grouped.get(doc.metadata.type)!.push(doc);
    }
    
    return grouped;
  }

  /**
   * 获取类型标题
   */
  private getTypeTitle(type: DocumentType): string {
    const titles = {
      [DocumentType.API]: 'API 参考',
      [DocumentType.GUIDE]: '使用指南',
      [DocumentType.TUTORIAL]: '教程',
      [DocumentType.EXAMPLE]: '示例',
      [DocumentType.REFERENCE]: '参考',
    };
    return titles[type];
  }

  /**
   * 生成样式内容
   */
  generateStyles(): string {
    return `
/* 基础样式 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f8f9fa;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* 头部 */
.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem 0;
    text-align: center;
}

.header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
}

/* 导航 */
.navigation {
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding: 1rem 0;
}

.navigation ul {
    display: flex;
    list-style: none;
    justify-content: center;
    gap: 2rem;
}

.navigation a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background-color 0.3s;
}

.navigation a:hover {
    background-color: #f0f0f0;
}

/* 主要内容 */
.main-content {
    padding: 2rem 0;
}

.section {
    margin-bottom: 3rem;
}

.section h2 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
    color: #333;
}

/* 文档卡片 */
.document-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.document-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.3s, box-shadow 0.3s;
}

.document-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.document-card h3 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    color: #333;
}

.document-card p {
    color: #666;
    margin-bottom: 1rem;
}

.meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: #888;
}

.tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.tag {
    background-color: #e5e7eb;
    color: #4b5563;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
}

/* 页脚 */
.footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem 0;
    margin-top: 3rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .navigation ul {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .document-list {
        grid-template-columns: 1fr;
    }
    
    .meta {
        flex-direction: column;
        gap: 0.25rem;
    }
}
    `;
  }
}

/**
 * 创建文档生成器
 */
export function createDocumentationGenerator(options: DocumentationGeneratorOptions): DocumentationGenerator {
  return new DocumentationGenerator(options);
}