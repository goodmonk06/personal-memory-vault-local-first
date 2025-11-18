import { logger } from './logger';

export interface MetricLabels {
  [key: string]: string | number;
}

class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  recordCounter(name: string, value: number = 1, labels?: MetricLabels): void {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    logger.debug('Counter recorded', { metric: name, value, labels });
  }

  recordGauge(name: string, value: number, labels?: MetricLabels): void {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);

    logger.debug('Gauge recorded', { metric: name, value, labels });
  }

  recordHistogram(name: string, value: number, labels?: MetricLabels): void {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);

    logger.debug('Histogram value recorded', { metric: name, value, labels });
  }

  recordDuration(name: string, durationMs: number, labels?: MetricLabels): void {
    this.recordHistogram(`${name}_duration_ms`, durationMs, labels);
  }

  getSnapshot(): MetricsSnapshot {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, values]) => [
          key,
          this.calculateHistogramStats(values),
        ])
      ),
    };
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private buildKey(name: string, labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  private calculateHistogramStats(values: number[]): HistogramStats {
    if (values.length === 0) {
      return { count: 0, sum: 0, min: 0, max: 0, avg: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      sum,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: this.percentile(sorted, 0.5),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99),
    };
  }

  private percentile(sortedValues: number[], p: number): number {
    const index = Math.ceil(sortedValues.length * p) - 1;
    return sortedValues[Math.max(0, index)];
  }
}

export interface HistogramStats {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50?: number;
  p95?: number;
  p99?: number;
}

export interface MetricsSnapshot {
  counters: Record<string, number>;
  gauges: Record<string, number>;
  histograms: Record<string, HistogramStats>;
}

export const metrics = new MetricsCollector();

// Helper for timing operations
export async function timed<T>(
  name: string,
  fn: () => Promise<T>,
  labels?: MetricLabels
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    metrics.recordDuration(name, Date.now() - start, labels);
    metrics.recordCounter(`${name}_success`, 1, labels);
    return result;
  } catch (error) {
    metrics.recordDuration(name, Date.now() - start, labels);
    metrics.recordCounter(`${name}_error`, 1, labels);
    throw error;
  }
}
