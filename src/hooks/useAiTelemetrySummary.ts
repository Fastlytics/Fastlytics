import { useMutation } from '@tanstack/react-query';
import { request } from '@/lib/api-client';

export interface DriverInfo {
  code: string;
  name: string;
  team: string;
}

export interface LapInfo {
  number: string;
  time?: string;
  compound?: string;
}

export interface TraceSamplePoint {
  distance: number;
  speed: number;
  throttle?: number;
  brake?: number;
  drs?: number;
  gear?: number;
  rpm?: number;
}

export interface ChartMetrics {
  max?: number;
  min?: number;
  avg?: number;
  trace_sample?: TraceSamplePoint[];
  extras?: Record<string, unknown>;
}

export interface TelemetrySummaryRequest {
  year: number;
  event: string;
  session: string;
  chart_type: string;
  chart_title: string;
  driver?: DriverInfo;
  drivers?: DriverInfo[];
  lap?: LapInfo;
  laps?: LapInfo[];
  chart_metrics: ChartMetrics;
}

export interface CornerAnalysis {
  number?: number;
  name?: string;
  analysis: string;
}

export interface TelemetrySummaryResponse {
  summary: string;
  key_insights: string[];
  corner_analysis: CornerAnalysis[];
  cached: boolean;
}

export function useAiTelemetrySummary() {
  return useMutation<TelemetrySummaryResponse, Error, TelemetrySummaryRequest>({
    mutationFn: (data: TelemetrySummaryRequest) =>
      request<TelemetrySummaryResponse>('/api/analysis/telemetry-summary', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}
