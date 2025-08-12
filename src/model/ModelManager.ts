/**
 * 增强的数据模型管理器
 * 提供数据模型定义、验证、转换和关联管理功能
 */

import { deepClone, generateId } from '../utils';

/**
 * 字段类型
 */
export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ARRAY = 'array',
  OBJECT = 'object',
  ANY = 'any',
}

/**
 * 字段定义
 */
export interface FieldDefinition {
  /**
   * 字段名
   */
  name: string;
  /**
   * 字段类型
   */
  type: FieldType;
  /**
   * 字段标签
   */
  label?: string;
  /**
   * 字段描述
   */
  description?: string;
  /**
   * 默认值
   */
  defaultValue?: any;
  /**
   * 是否必填
   */
  required?: boolean;
  /**
   * 最小值
   */
  min?: number;
  /**
   * 最大值
   */
  max?: number;
  /**
   * 最小长度
   */
  minLength?: number;
  /**
   * 最大长度
   */
  maxLength?: number;
  /**
   * 正则表达式
   */
  pattern?: string;
  /**
   * 枚举值
   */
  enum?: any[];
  /**
   * 验证函数
   */
  validator?: (value: any) => boolean | string;
  /**
   * 转换函数
   */
  transformer?: (value: any) => any;
  /**
   * 是否只读
   */
  readonly?: boolean;
  /**
   * 是否隐藏
   */
  hidden?: boolean;
  /**
   * 自定义属性
   */
  custom?: Record<string, any>;
}

/**
 * 索引定义
 */
export interface IndexDefinition {
  /**
   * 索引名
   */
  name: string;
  /**
   * 索引字段
   */
  fields: string[];
  /**
   * 是否唯一
   */
  unique?: boolean;
  /**
   * 是否稀疏
   */
  sparse?: boolean;
}

/**
 * 关联定义
 */
export interface AssociationDefinition {
  /**
   * 关联名
   */
  name: string;
  /**
   * 关联类型
   */
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany';
  /**
   * 目标模型
   */
  targetModel: string;
  /**
   * 外键
   */
  foreignKey?: string;
  /**
   * 目标键
   */
  targetKey?: string;
  /**
   * 中间表
   */
  through?: string;
  /**
   * 自定义属性
   */
  custom?: Record<string, any>;
}

/**
 * 模型定义
 */
export interface ModelDefinition {
  /**
   * 模型名
   */
  name: string;
  /**
   * 模型标签
   */
  label?: string;
  /**
   * 模型描述
   */
  description?: string;
  /**
   * 字段定义
   */
  fields: FieldDefinition[];
  /**
   * 索引定义
   */
  indexes?: IndexDefinition[];
  /**
   * 关联定义
   */
  associations?: AssociationDefinition[];
  /**
   * 钩子函数
   */
  hooks?: {
    /**
     * 创建前
     */
    beforeCreate?: (data: any) => any | Promise<any>;
    /**
     * 创建后
     */
    afterCreate?: (data: any) => void | Promise<void>;
    /**
     * 更新前
     */
    beforeUpdate?: (data: any) => any | Promise<any>;
    /**
     * 更新后
     */
    afterUpdate?: (data: any) => void | Promise<void>;
    /**
     * 删除前
     */
    beforeDelete?: (data: any) => void | Promise<void>;
    /**
     * 删除后
     */
    afterDelete?: (data: any) => void | Promise<void>;
  };
  /**
   * 静态方法
   */
  staticMethods?: Record<string, (this: any, ...args: any[]) => any>;
  /**
   * 实例方法
   */
  instanceMethods?: Record<string, (this: any, ...args: any[]) => any>;
  /**
   * 计算属性
   */
  computed?: Record<string, (this: any) => any>;
  /**
   * 自定义属性
   */
  custom?: Record<string, any>;
}

/**
 * 验证错误
 */
export interface ValidationError {
  /**
   * 字段名
   */
  field: string;
  /**
   * 错误消息
   */
  message: string;
  /**
   * 错误值
   */
  value: any;
}

/**
 * 模型实例
 */
export interface ModelInstance {
  /**
   * 模型名
   */
  $modelName: string;
  /**
   * 数据
   */
  $data: Record<string, any>;
  /**
   * 原始数据
   */
  $originalData: Record<string, any>;
  /**
   * 是否已修改
   */
  $isDirty: boolean;
  /**
   * 是否已删除
   */
  $isDeleted: boolean;
  /**
   * 是否新建
   */
  $isNew: boolean;
  /**
   * 验证错误
   */
  $errors: ValidationError[];
  /**
   * 获取字段值
   */
  get: (field: string) => any;
  /**
   * 设置字段值
   */
  set: (field: string, value: any) => void;
  /**
   * 保存
   */
  save: () => Promise<void>;
  /**
   * 删除
   */
  delete: () => Promise<void>;
  /**
   * 验证
   */
  validate: () => boolean;
  /**
   * 撤销
   */
  revert: () => void;
  /**
   * 刷新
   */
  refresh: () => Promise<void>;
  /**
   * 获取关联数据
   */
  getAssociation: (name: string) => any;
}

/**
 * 模型管理器选项
 */
export interface ModelManagerOptions {
  /**
   * 是否启用严格模式
   */
  strictMode?: boolean;
  /**
   * 是否启用自动验证
   */
  autoValidate?: boolean;
  /**
   * 是否启用自动转换
   */
  autoTransform?: boolean;
}

/**
 * 增强的模型管理器
 */
export class ModelManager {
  private models: Map<string, ModelDefinition> = new Map();
  private modelClasses: Map<string, any> = new Map();
  private strictMode: boolean;
  private autoValidate: boolean;
  private autoTransform: boolean;

  constructor(options: ModelManagerOptions = {}) {
    this.strictMode = options.strictMode ?? true;
    this.autoValidate = options.autoValidate ?? true;
    this.autoTransform = options.autoTransform ?? true;
  }

  /**
   * 注册模型
   */
  registerModel(definition: ModelDefinition): void {
    const { name } = definition;

    // 检查模型是否已注册
    if (this.models.has(name)) {
      throw new Error(`Model "${name}" is already registered`);
    }

    // 验证模型定义
    this.validateModelDefinition(definition);

    // 注册模型
    this.models.set(name, definition);

    // 创建模型类
    const modelClass = this.createModelClass(definition);
    this.modelClasses.set(name, modelClass);
  }

  /**
   * 验证模型定义
   */
  private validateModelDefinition(definition: ModelDefinition): void {
    const { name, fields } = definition;

    // 验证模型名
    if (!name || typeof name !== 'string') {
      throw new Error('Model name is required and must be a string');
    }

    // 验证字段
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      throw new Error(`Model "${name}" must have at least one field`);
    }

    // 验证字段定义
    const fieldNames = new Set<string>();
    for (const field of fields) {
      if (!field.name || typeof field.name !== 'string') {
        throw new Error(`Field name is required and must be a string in model "${name}"`);
      }

      if (fieldNames.has(field.name)) {
        throw new Error(`Duplicate field name "${field.name}" in model "${name}"`);
      }

      fieldNames.add(field.name);

      // 验证字段类型
      if (!Object.values(FieldType).includes(field.type)) {
        throw new Error(`Invalid field type "${field.type}" for field "${field.name}" in model "${name}"`);
      }
    }
  }

  /**
   * 创建模型类
   */
  private createModelClass(definition: ModelDefinition): any {
    const { name, fields, hooks, staticMethods, instanceMethods, computed } = definition;

    // 创建模型类
    class Model {
      public $modelName: string = name;
      public $data: Record<string, any> = {};
      public $originalData: Record<string, any> = {};
      public $isDirty: boolean = false;
      public $isDeleted: boolean = false;
      public $isNew: boolean = true;
      public $errors: ValidationError[] = [];

      constructor(data: Record<string, any> = {}) {
        // 初始化数据
        this.initializeData(data);
      }

      /**
       * 初始化数据
       */
      private initializeData(data: Record<string, any>): void {
        // 设置默认值
        for (const field of fields) {
          if (field.defaultValue !== undefined && data[field.name] === undefined) {
            this.$data[field.name] = deepClone(field.defaultValue);
          }
        }

        // 设置数据
        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            this.set(key, data[key]);
          }
        }

        // 保存原始数据
        this.$originalData = deepClone(this.$data);
      }

      /**
       * 获取字段值
       */
      get(field: string): any {
        // 检查计算属性
        if (computed && computed[field]) {
          return computed[field].call(this);
        }

        return this.$data[field];
      }

      /**
       * 设置字段值
       */
      set(field: string, value: any): void {
        // 检查字段是否存在
        const fieldDef = fields.find(f => f.name === field);
        if (!fieldDef) {
          if (this.strictMode) {
            throw new Error(`Field "${field}" does not exist in model "${name}"`);
          }
          this.$data[field] = value;
          this.$isDirty = true;
          return;
        }

        // 检查是否只读
        if (fieldDef.readonly) {
          if (this.strictMode) {
            throw new Error(`Field "${field}" is readonly in model "${name}"`);
          }
          return;
        }

        // 转换值
        let transformedValue = value;
        if (this.autoTransform && fieldDef.transformer) {
          try {
            transformedValue = fieldDef.transformer(value);
          } catch (error) {
            if (this.strictMode) {
              throw new Error(`Failed to transform value for field "${field}" in model "${name}": ${error}`);
            }
          }
        }

        // 设置值
        const oldValue = this.$data[field];
        this.$data[field] = transformedValue;

        // 检查是否修改
        if (JSON.stringify(oldValue) !== JSON.stringify(transformedValue)) {
          this.$isDirty = true;
        }

        // 自动验证
        if (this.autoValidate) {
          this.validateField(field);
        }
      }

      /**
       * 保存
       */
      async save(): Promise<void> {
        // 验证
        if (!this.validate()) {
          throw new Error(`Validation failed for model "${name}"`);
        }

        // 执行钩子
        if (this.$isNew && hooks?.beforeCreate) {
          await hooks.beforeCreate.call(this, this.$data);
        } else if (!this.$isNew && hooks?.beforeUpdate) {
          await hooks.beforeUpdate.call(this, this.$data);
        }

        // 这里应该调用API保存数据
        // 由于没有具体的API客户端，这里只是模拟
        console.log(`Saving data for model "${name}"`);

        // 更新状态
        this.$isNew = false;
        this.$isDirty = false;
        this.$originalData = deepClone(this.$data);

        // 执行钩子
        if (this.$isNew && hooks?.afterCreate) {
          await hooks.afterCreate.call(this, this.$data);
        } else if (!this.$isNew && hooks?.afterUpdate) {
          await hooks.afterUpdate.call(this, this.$data);
        }
      }

      /**
       * 删除
       */
      async delete(): Promise<void> {
        // 执行钩子
        if (hooks?.beforeDelete) {
          await hooks.beforeDelete.call(this, this.$data);
        }

        // 这里应该调用API删除数据
        // 由于没有具体的API客户端，这里只是模拟
        console.log(`Deleting data for model "${name}"`);

        // 更新状态
        this.$isDeleted = true;

        // 执行钩子
        if (hooks?.afterDelete) {
          await hooks.afterDelete.call(this, this.$data);
        }
      }

      /**
       * 验证
       */
      validate(): boolean {
        this.$errors = [];

        // 验证所有字段
        for (const field of fields) {
          this.validateField(field.name);
        }

        return this.$errors.length === 0;
      }

      /**
       * 验证字段
       */
      private validateField(fieldName: string): void {
        const fieldDef = fields.find(f => f.name === fieldName);
        if (!fieldDef) {
          return;
        }

        const value = this.$data[fieldName];

        // 检查必填
        if (fieldDef.required && (value === null || value === undefined || value === '')) {
          this.$errors.push({
            field: fieldName,
            message: `Field "${fieldDef.label || fieldName}" is required`,
            value,
          });
          return;
        }

        // 如果值为空且非必填，跳过其他验证
        if (value === null || value === undefined || value === '') {
          return;
        }

        // 验证类型
        if (fieldDef.type !== FieldType.ANY) {
          let isValid = true;
          switch (fieldDef.type) {
            case FieldType.STRING:
              isValid = typeof value === 'string';
              break;
            case FieldType.NUMBER:
              isValid = typeof value === 'number' && !isNaN(value);
              break;
            case FieldType.BOOLEAN:
              isValid = typeof value === 'boolean';
              break;
            case FieldType.DATE:
              isValid = value instanceof Date || !isNaN(Date.parse(value));
              break;
            case FieldType.ARRAY:
              isValid = Array.isArray(value);
              break;
            case FieldType.OBJECT:
              isValid = typeof value === 'object' && value !== null && !Array.isArray(value);
              break;
          }

          if (!isValid) {
            this.$errors.push({
              field: fieldName,
              message: `Field "${fieldDef.label || fieldName}" must be of type ${fieldDef.type}`,
              value,
            });
            return;
          }
        }

        // 验证最小值
        if (fieldDef.min !== undefined && typeof value === 'number' && value < fieldDef.min) {
          this.$errors.push({
            field: fieldName,
            message: `Field "${fieldDef.label || fieldName}" must be at least ${fieldDef.min}`,
            value,
          });
        }

        // 验证最大值
        if (fieldDef.max !== undefined && typeof value === 'number' && value > fieldDef.max) {
          this.$errors.push({
            field: fieldName,
            message: `Field "${fieldDef.label || fieldName}" must be at most ${fieldDef.max}`,
            value,
          });
        }

        // 验证最小长度
        if (fieldDef.minLength !== undefined && typeof value === 'string' && value.length < fieldDef.minLength) {
          this.$errors.push({
            field: fieldName,
            message: `Field "${fieldDef.label || fieldName}" must be at least ${fieldDef.minLength} characters`,
            value,
          });
        }

        // 验证最大长度
        if (fieldDef.maxLength !== undefined && typeof value === 'string' && value.length > fieldDef.maxLength) {
          this.$errors.push({
            field: fieldName,
            message: `Field "${fieldDef.label || fieldName}" must be at most ${fieldDef.maxLength} characters`,
            value,
          });
        }

        // 验证正则表达式
        if (fieldDef.pattern && typeof value === 'string') {
          const regex = new RegExp(fieldDef.pattern);
          if (!regex.test(value)) {
            this.$errors.push({
              field: fieldName,
              message: `Field "${fieldDef.label || fieldName}" does not match the required pattern`,
              value,
            });
          }
        }

        // 验证枚举值
        if (fieldDef.enum && !fieldDef.enum.includes(value)) {
          this.$errors.push({
            field: fieldName,
            message: `Field "${fieldDef.label || fieldName}" must be one of ${fieldDef.enum.join(', ')}`,
            value,
          });
        }

        // 自定义验证
        if (fieldDef.validator) {
          const result = fieldDef.validator(value);
          if (result !== true) {
            this.$errors.push({
              field: fieldName,
              message: typeof result === 'string' ? result : `Field "${fieldDef.label || fieldName}" is invalid`,
              value,
            });
          }
        }
      }

      /**
       * 撤销
       */
      revert(): void {
        this.$data = deepClone(this.$originalData);
        this.$isDirty = false;
        this.$errors = [];
      }

      /**
       * 刷新
       */
      async refresh(): Promise<void> {
        // 这里应该调用API获取最新数据
        // 由于没有具体的API客户端，这里只是模拟
        console.log(`Refreshing data for model "${name}"`);

        // 更新数据
        this.$originalData = deepClone(this.$data);
        this.$isDirty = false;
      }

      /**
       * 获取关联数据
       */
      getAssociation(name: string): any {
        // 这里应该实现关联数据的获取
        // 由于没有具体的关联实现，这里只是返回null
        console.log(`Getting association "${name}" for model "${name}"`);
        return null;
      }
    }

    // 添加静态方法
    if (staticMethods) {
      for (const [methodName, method] of Object.entries(staticMethods)) {
        (Model as any)[methodName] = method;
      }
    }

    // 添加实例方法
    if (instanceMethods) {
      for (const [methodName, method] of Object.entries(instanceMethods)) {
        Model.prototype[methodName] = method;
      }
    }

    return Model;
  }

  /**
   * 获取模型类
   */
  getModelClass(name: string): any {
    const modelClass = this.modelClasses.get(name);
    if (!modelClass) {
      throw new Error(`Model "${name}" is not registered`);
    }
    return modelClass;
  }

  /**
   * 创建模型实例
   */
  createInstance(name: string, data: Record<string, any> = {}): ModelInstance {
    const ModelClass = this.getModelClass(name);
    return new ModelClass(data) as ModelInstance;
  }

  /**
   * 获取模型定义
   */
  getModelDefinition(name: string): ModelDefinition {
    const definition = this.models.get(name);
    if (!definition) {
      throw new Error(`Model "${name}" is not registered`);
    }
    return definition;
  }

  /**
   * 获取所有模型名
   */
  getModelNames(): string[] {
    return Array.from(this.models.keys());
  }

  /**
   * 检查模型是否已注册
   */
  hasModel(name: string): boolean {
    return this.models.has(name);
  }

  /**
   * 销毁模型管理器
   */
  destroy(): void {
    this.models.clear();
    this.modelClasses.clear();
  }
}

/**
 * 创建模型管理器
 */
export function createModelManager(options: ModelManagerOptions = {}): ModelManager {
  return new ModelManager(options);
}
