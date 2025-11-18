import { IStorageAdapter } from '../index';

/**
 * In-memory storage adapter
 * Useful for testing or temporary storage
 */
export class MemoryStorageAdapter implements IStorageAdapter {
  private storage: Map<string, any> = new Map();

  async save(key: string, data: any): Promise<void> {
    this.storage.set(key, JSON.parse(JSON.stringify(data))); // Deep clone
  }

  async load(key: string): Promise<any> {
    const data = this.storage.get(key);
    return data ? JSON.parse(JSON.stringify(data)) : null; // Deep clone
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async list(prefix?: string): Promise<string[]> {
    const keys = Array.from(this.storage.keys());

    if (prefix) {
      return keys.filter((key) => key.startsWith(prefix));
    }

    return keys;
  }

  // Utility method for testing
  clear(): void {
    this.storage.clear();
  }
}
