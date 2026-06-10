import { storage } from './storage';

export type SyncOperation = {
  id: string;
  table: 'members' | 'classes' | 'logs';
  type: 'insert' | 'update' | 'delete';
  payload: Record<string, any>;
  tempId?: string;
  createdAt: number;
  retries: number;
};

let queueFlushInProgress = false;

export const syncQueue = {
  async getAll(): Promise<SyncOperation[]> {
    return storage.getSyncQueue<SyncOperation[]>() ?? [];
  },

  async add(op: Omit<SyncOperation, 'id' | 'createdAt' | 'retries'>): Promise<void> {
    const queue = await this.getAll();
    queue.push({
      ...op,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: Date.now(),
      retries: 0,
    });
    await storage.setSyncQueue(queue);
  },

  async remove(id: string): Promise<void> {
    const queue = await this.getAll();
    await storage.setSyncQueue(queue.filter(op => op.id !== id));
  },

  async incrementRetry(id: string): Promise<void> {
    const queue = await this.getAll();
    const op = queue.find(o => o.id === id);
    if (op) op.retries += 1;
    await storage.setSyncQueue(queue);
  },

  async flush(executor: (op: SyncOperation) => Promise<boolean>): Promise<void> {
    if (queueFlushInProgress) return;
    queueFlushInProgress = true;

    const queue = await this.getAll();
    for (const op of [...queue].sort((a, b) => a.createdAt - b.createdAt)) {
      if (op.retries >= 3) continue;
      const ok = await executor(op);
      if (ok) {
        await this.remove(op.id);
      } else {
        await this.incrementRetry(op.id);
      }
    }

    queueFlushInProgress = false;
  },
};
