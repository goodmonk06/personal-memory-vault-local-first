# Integration Recipes

This document provides practical examples of how to integrate the Personal Memory Vault with other systems and services.

## Table of Contents

1. [AI Assistant Integration](#ai-assistant-integration)
2. [Notification Systems](#notification-systems)
3. [Analytics & Tracking](#analytics--tracking)
4. [Vector Search Integration](#vector-search-integration)
5. [Export to External Systems](#export-to-external-systems)
6. [Webhook Integration](#webhook-integration)

## AI Assistant Integration

### Use Case: Provide Personal Context to LLM

Use the query API to retrieve relevant memories before sending prompts to an LLM:

```typescript
// Example: Context-aware AI assistant
import { MemoryVaultClient } from './memory-vault-client';

class ContextAwareAssistant {
  constructor(
    private memoryVault: MemoryVaultClient,
    private llm: LLMClient
  ) {}

  async chat(userMessage: string): Promise<string> {
    // 1. Query memory vault for relevant context
    const context = await this.memoryVault.query({
      queryText: userMessage,
      limit: 5,
    });

    // 2. Build context-enriched prompt
    const contextStr = context.items
      .map((item) => `[${item.type}] ${item.title}: ${item.content}`)
      .join('\n\n');

    const prompt = `
      Based on the following context from the user's memory vault:

      ${contextStr}

      User question: ${userMessage}

      Please provide a helpful, context-aware response.
    `;

    // 3. Send to LLM
    const response = await this.llm.complete(prompt);

    // 4. Optionally store the interaction
    await this.memoryVault.createMemory({
      type: 'event',
      title: `AI Chat: ${userMessage.substring(0, 50)}...`,
      content: response,
      tags: ['ai-interaction', 'chat'],
      source: { assistant: 'contextaware', timestamp: new Date().toISOString() },
    });

    return response;
  }
}
```

### Use Case: Auto-Tagging with AI

```typescript
// Example: AI-powered auto-tagging
import { eventEmitter } from './lib/events';
import { IAIAdapter } from './lib/adapters';

class AutoTaggerService {
  constructor(private aiAdapter: IAIAdapter) {
    // Listen to memory creation events
    eventEmitter.on('memory.created', async (event) => {
      await this.autoTag(event.payload.memoryId);
    });
  }

  async autoTag(memoryId: string) {
    const memory = await memoryRepo.findById(memoryId);
    if (!memory) return;

    // Use AI to extract keywords and classify content
    const keywords = await this.aiAdapter.extractKeywords(
      `${memory.title}\n\n${memory.content}`
    );

    const classification = await this.aiAdapter.classifyContent(memory.content);

    // Update memory with suggested tags
    const newTags = [...new Set([...memory.tags, ...keywords, ...classification.suggestedTags])];

    await memoryRepo.update(memoryId, {
      tags: newTags.slice(0, 20), // Limit to 20 tags
    });
  }
}
```

## Notification Systems

### Use Case: Slack Notifications

```typescript
// Example: Send Slack notification when important memory is created
import { INotificationAdapter, Notification } from './lib/adapters';
import { IncomingWebhook } from '@slack/webhook';

class SlackNotificationAdapter implements INotificationAdapter {
  private webhook: IncomingWebhook;

  constructor(webhookUrl: string) {
    this.webhook = new IncomingWebhook(webhookUrl);
  }

  async send(notification: Notification): Promise<void> {
    const color = {
      info: '#3498db',
      success: '#2ecc71',
      warning: '#f39c12',
      error: '#e74c3c',
    }[notification.type];

    await this.webhook.send({
      text: notification.title,
      attachments: [
        {
          color,
          text: notification.message,
          footer: 'Memory Vault',
          ts: Math.floor(Date.now() / 1000).toString(),
        },
      ],
    });
  }
}

// Usage
const slackAdapter = new SlackNotificationAdapter(process.env.SLACK_WEBHOOK_URL!);

eventEmitter.on('memory.created', async (event) => {
  if (event.payload.tags.includes('important')) {
    await slackAdapter.send({
      title: 'Important Memory Created',
      message: event.payload.title,
      type: 'info',
    });
  }
});
```

### Use Case: Email Notifications

```typescript
// Example: Email notification adapter
import { INotificationAdapter, Notification } from './lib/adapters';
import nodemailer from 'nodemailer';

class EmailNotificationAdapter implements INotificationAdapter {
  private transporter: nodemailer.Transporter;

  constructor(private config: EmailConfig) {
    this.transporter = nodemailer.createTransporter(config.smtp);
  }

  async send(notification: Notification): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.fromAddress,
      to: this.config.toAddress,
      subject: `[Memory Vault] ${notification.title}`,
      html: `
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
        <p><small>Type: ${notification.type}</small></p>
      `,
    });
  }
}
```

## Analytics & Tracking

### Use Case: Google Analytics Integration

```typescript
// Example: Track memory usage with Google Analytics
import { IAnalyticsAdapter, AnalyticsEvent } from './lib/adapters';
import { Analytics } from '@google-analytics/analytics';

class GoogleAnalyticsAdapter implements IAnalyticsAdapter {
  private analytics: Analytics;

  constructor(trackingId: string) {
    this.analytics = new Analytics(trackingId);
  }

  async track(event: AnalyticsEvent): Promise<void> {
    await this.analytics.event({
      category: 'Memory Vault',
      action: event.name,
      label: JSON.stringify(event.properties),
      value: event.properties?.value,
    });
  }
}

// Usage: Track all memory operations
const analyticsAdapter = new GoogleAnalyticsAdapter(process.env.GA_TRACKING_ID!);

eventEmitter.onAny(async (event) => {
  await analyticsAdapter.track({
    name: event.type,
    properties: {
      ...event.payload,
      timestamp: event.timestamp,
    },
  });
});
```

## Vector Search Integration

### Use Case: Semantic Search with OpenAI Embeddings

```typescript
// Example: Vector search using OpenAI embeddings
import { ISearchAdapter, SearchResult } from './lib/adapters';
import { OpenAI } from 'openai';
import { MemoryItemParsed } from '../types';

class VectorSearchAdapter implements ISearchAdapter {
  private openai: OpenAI;
  private vectorStore: Map<string, { embedding: number[]; item: MemoryItemParsed }> = new Map();

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async index(item: MemoryItemParsed): Promise<void> {
    const text = `${item.title}\n\n${item.content}`;
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    this.vectorStore.set(item.id, {
      embedding: response.data[0].embedding,
      item,
    });
  }

  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    // Generate query embedding
    const queryResponse = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });

    const queryEmbedding = queryResponse.data[0].embedding;

    // Calculate cosine similarity
    const results = Array.from(this.vectorStore.entries())
      .map(([id, { embedding }]) => ({
        itemId: id,
        score: this.cosineSimilarity(queryEmbedding, embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  async delete(itemId: string): Promise<void> {
    this.vectorStore.delete(itemId);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

// Usage
const vectorSearch = new VectorSearchAdapter(process.env.OPENAI_API_KEY!);

// Index all existing memories
const memories = memoryRepo.findAll(10000);
for (const memory of memories) {
  await vectorSearch.index(memory);
}

// Listen for new memories
eventEmitter.on('memory.created', async (event) => {
  const memory = await memoryRepo.findById(event.payload.memoryId);
  if (memory) {
    await vectorSearch.index(memory);
  }
});

// Enhanced search combining FTS and vector search
async function hybridSearch(query: string, limit: number = 10) {
  const [ftsResults, vectorResults] = await Promise.all([
    memoryRepo.search(query, undefined, limit),
    vectorSearch.search(query, limit),
  ]);

  // Combine and deduplicate results
  const combined = new Map<string, { item: MemoryItemParsed; score: number }>();

  ftsResults.forEach((item) => {
    combined.set(item.id, { item, score: 0.5 }); // FTS score
  });

  vectorResults.forEach((result) => {
    const existing = combined.get(result.itemId);
    if (existing) {
      existing.score += result.score * 0.5; // Boost if in both
    } else {
      const item = memoryRepo.findById(result.itemId);
      if (item) {
        combined.set(result.itemId, { item, score: result.score * 0.5 });
      }
    }
  });

  return Array.from(combined.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);
}
```

## Export to External Systems

### Use Case: Sync to Notion

```typescript
// Example: Export memories to Notion
import { Client } from '@notionhq/client';
import { MemoryItemParsed } from '../types';

class NotionExporter {
  private notion: Client;

  constructor(apiKey: string, private databaseId: string) {
    this.notion = new Client({ auth: apiKey });
  }

  async exportMemory(memory: MemoryItemParsed): Promise<void> {
    await this.notion.pages.create({
      parent: { database_id: this.databaseId },
      properties: {
        Title: {
          title: [{ text: { content: memory.title } }],
        },
        Type: {
          select: { name: memory.type },
        },
        Tags: {
          multi_select: memory.tags.map((tag) => ({ name: tag })),
        },
        Created: {
          date: { start: memory.createdAt },
        },
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: memory.content } }],
          },
        },
      ],
    });
  }

  async syncAll(): Promise<void> {
    const memories = memoryRepo.findAll(10000);
    for (const memory of memories) {
      await this.exportMemory(memory);
    }
  }
}
```

## Webhook Integration

### Use Case: Webhook Notifications

```typescript
// Example: Send webhooks on memory events
class WebhookNotifier {
  constructor(private webhookUrl: string) {
    this.setupListeners();
  }

  private setupListeners() {
    eventEmitter.onAny(async (event) => {
      await this.sendWebhook(event);
    });
  }

  private async sendWebhook(event: DomainEvent): Promise<void> {
    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Memory-Vault-Event': event.type,
          'X-Memory-Vault-ID': event.id,
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      logger.error('Failed to send webhook', error);
    }
  }
}

// Usage
new WebhookNotifier(process.env.WEBHOOK_URL!);
```

## Best Practices

1. **Error Handling**: Always wrap adapter calls in try-catch blocks
2. **Async Operations**: Use event listeners for non-blocking integrations
3. **Rate Limiting**: Implement backoff for external API calls
4. **Idempotency**: Make sure webhook handlers are idempotent
5. **Monitoring**: Track adapter success/failure rates
6. **Configuration**: Use environment variables for API keys and URLs
7. **Testing**: Mock adapters in tests for isolation

## Common Patterns

### Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Circuit Breaker

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}
```
