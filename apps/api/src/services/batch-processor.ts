import { EventEmitter } from 'events';
import { redisManager } from './redis-client';
import { dataPipeline, RawEvent, ProcessedEvent, BatchJob } from './data-pipeline';

export interface BatchConfiguration {
  batchSize: number;
  maxConcurrency: number;
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
}

export class BatchProcessorManager extends EventEmitter {
  private isRunning: boolean = false;
  private activeJobs: Map<string, BatchJob> = new Map();
  private config: BatchConfiguration;

  constructor(config?: Partial<BatchConfiguration>) {
    super();
    this.config = {
      batchSize: config?.batchSize ?? 100,
      maxConcurrency: config?.maxConcurrency ?? 5,
      retryAttempts: config?.retryAttempts ?? 3,
      retryDelay: config?.retryDelay ?? 5000,
      timeout: config?.timeout ?? 300000
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('📊 Batch processor is already running');
      return;
    }
    this.isRunning = true;
    console.log('🚀 Batch processor started successfully');
    this.emit('processor:started');
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('⏹️ Batch processor stopped');
    this.emit('processor:stopped');
  }

  async processBatchEvents(events: RawEvent[]): Promise<ProcessedEvent[]> {
    const results: ProcessedEvent[] = [];
    const { batchSize } = this.config;
    
    for (let i = 0; i < events.length; i += batchSize) {
      const chunk = events.slice(i, i + batchSize);
      
      const chunkResults = await Promise.allSettled(
        chunk.map(event => dataPipeline.processEvent(event))
      );

      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }
    }
    
    return results;
  }

  getActiveJobs(): BatchJob[] {
    return Array.from(this.activeJobs.values());
  }
}

export const batchProcessor = new BatchProcessorManager();
