/**
 * 数据安全服务实现
 * 处理数据加密、解密和安全存储
 */

import { IDataSecurityService } from './ServiceInterfaces';

export class DataSecurityService implements IDataSecurityService {
  private initialized = false;
  private encryptionKey: CryptoKey | null = null;
  private keyAlgorithm = 'AES-GCM';
  private keyLength = 256; // bits
  private ivLength = 12; // bytes for AES-GCM

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 检查是否支持Web Crypto API
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API is not supported in this environment');
      }

      // 生成或加载加密密钥
      await this.initializeEncryptionKey();

      this.initialized = true;
      console.log('Data security service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize data security service:', error);
      throw error;
    }
  }

  async encrypt(data: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    try {
      // 编码数据为Uint8Array
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      // 生成随机IV
      const iv = window.crypto.getRandomValues(new Uint8Array(this.ivLength));

      // 加密数据
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: this.keyAlgorithm,
          iv
        },
        this.encryptionKey,
        dataBuffer
      );

      // 将IV和加密数据合并并转换为Base64
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const combined = new Uint8Array(iv.length + encryptedArray.length);
      combined.set(iv, 0);
      combined.set(encryptedArray, iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Failed to encrypt data:', error);
      throw error;
    }
  }

  async decrypt(encryptedData: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    try {
      // 从Base64解码数据
      const combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      // 提取IV和加密数据
      const iv = combined.slice(0, this.ivLength);
      const encryptedArray = combined.slice(this.ivLength);

      // 解密数据
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: this.keyAlgorithm,
          iv
        },
        this.encryptionKey,
        encryptedArray
      );

      // 解码为字符串
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      throw error;
    }
  }

  async hash(data: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // 编码数据为Uint8Array
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      // 计算SHA-256哈希
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);

      // 转换为十六进制字符串
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Failed to hash data:', error);
      throw error;
    }
  }

  async generateSecureToken(length: number = 32): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // 生成随机值
      const randomValues = new Uint8Array(length);
      window.crypto.getRandomValues(randomValues);

      // 转换为Base64 URL安全字符串
      return btoa(String.fromCharCode(...randomValues))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    } catch (error) {
      console.error('Failed to generate secure token:', error);
      throw error;
    }
  }

  async validateSecureToken(token: string): Promise<boolean> {
    try {
      // 检查token格式（Base64 URL安全字符串）
      const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
      if (!base64UrlRegex.test(token)) {
        return false;
      }

      // 检查token长度（至少16个字符）
      return token.length >= 16;
    } catch (error) {
      console.error('Failed to validate secure token:', error);
      return false;
    }
  }

  /**
   * 初始化加密密钥
   */
  private async initializeEncryptionKey(): Promise<void> {
    try {
      // 尝试从存储加载密钥
      const storedKey = localStorage.getItem('focusflow-encryption-key');

      if (storedKey) {
        try {
          // 从存储的密钥数据导入密钥
          const keyData = new Uint8Array(
            atob(storedKey)
              .split('')
              .map(char => char.charCodeAt(0))
          );

          this.encryptionKey = await window.crypto.subtle.importKey(
            'raw',
            keyData,
            {
              name: this.keyAlgorithm,
              length: this.keyLength
            },
            false,
            ['encrypt', 'decrypt']
          );

          console.log('Encryption key loaded from storage');
          return;
        } catch (error) {
          console.warn('Failed to load encryption key from storage, generating new key:', error);
        }
      }

      // 生成新的加密密钥
      const keyData = window.crypto.getRandomValues(new Uint8Array(this.keyLength / 8));

      this.encryptionKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        {
          name: this.keyAlgorithm,
          length: this.keyLength
        },
        false,
        ['encrypt', 'decrypt']
      );

      // 保存密钥到存储
      const storedKeyData = btoa(String.fromCharCode(...keyData));
      localStorage.setItem('focusflow-encryption-key', storedKeyData);

      console.log('New encryption key generated and saved');
    } catch (error) {
      console.error('Failed to initialize encryption key:', error);
      throw error;
    }
  }

  /**
   * 安全地存储敏感数据
   */
  async secureStore(key: string, data: any): Promise<void> {
    try {
      // 序列化数据
      const serialized = JSON.stringify(data);

      // 加密数据
      const encrypted = await this.encrypt(serialized);

      // 存储加密数据
      localStorage.setItem(`secure-${key}`, encrypted);
    } catch (error) {
      console.error(`Failed to securely store data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 安全地检索敏感数据
   */
  async secureRetrieve<T>(key: string): Promise<T | null> {
    try {
      // 获取加密数据
      const encrypted = localStorage.getItem(`secure-${key}`);

      if (!encrypted) {
        return null;
      }

      // 解密数据
      const decrypted = await this.decrypt(encrypted);

      // 反序列化数据
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error(`Failed to securely retrieve data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * 安全地删除敏感数据
   */
  async secureDelete(key: string): Promise<void> {
    try {
      localStorage.removeItem(`secure-${key}`);
    } catch (error) {
      console.error(`Failed to securely delete data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * 清除所有安全存储的数据
   */
  async clearSecureStorage(): Promise<void> {
    try {
      // 获取所有键
      const keys = Object.keys(localStorage);

      // 删除所有以'secure-'开头的键
      for (const key of keys) {
        if (key.startsWith('secure-')) {
          localStorage.removeItem(key);
        }
      }

      // 删除加密密钥
      localStorage.removeItem('focusflow-encryption-key');

      // 重置加密密钥
      this.encryptionKey = null;

      // 重新初始化加密密钥
      await this.initializeEncryptionKey();
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
      throw error;
    }
  }
}
