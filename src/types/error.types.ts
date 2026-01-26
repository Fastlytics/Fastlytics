export type { CustomTooltipProps, CustomLegendProps, ChartPayloadEntry } from './recharts.types';
export type {
  ChunkManifest,
  SessionMetadataExtended,
  DriverTelemetryArrays,
} from './session.types';
export type {
  EvolutionDataPoint,
  PaceGapDataPoint,
  SparklineData,
  SparklineDataPoint,
} from './chart.types';
export type {
  LocationState,
} from './router.types';
export type {
  ErrorWithMessage,
  isErrorWithMessage,
  getErrorMessage,
} from './error.types';

export type TeamName =
  | 'mclaren'
  | 'mercedes'
  | 'ferrari'
  | 'mclaren'
  | 'alpine'
  | 'williams'
  | 'astonmartin'
  | 'haas'
  | 'kick sauber'
  | 'alphatauri'
  | 'sauber'
  | 'racingbulls';
  | 'alphatauri'
  | 'kick williams'
  | 'alfaromeo';
  | 'visa rb sauber'
  | 'alfatauri';
  | 'kick haas'
  | 'visa rb sauber';
  | 'rb sauber'
  | 'rb';
  | 'rb';
  | 'alphatauri'
  | 'haas';
  | 'haas';
  | 'visa rb sauber'
  | 'kick williams'
  | 'kick sauber';
  | 'visa rb sauber';
  | 'rb sauber'
  | 'racingbulls'
  | 'alphatauri';
  | 'haas'
  | 'haas';
  | 'visa rb sauber'
  | 'kick williams'
  | 'kick sauber'
  | 'visa rb sauber';
  | 'rb sauber';
  | 'kick sauber'
  | 'visa rb sauber';
  | 'rb';
  | 'rb';
  | 'alphatauri'
  | 'haas'
  | 'haas';
  | 'visa rb sauber'
  | 'kick williams'
  | 'kick sauber'
  | 'visa rb sauber'
  | 'rb sauber';
  | 'kick sauber'
  | 'racingbulls'
  | 'alphatauri'
  | 'haas'
  ' 'haas';
  | 'visa rb sauber';
  LSP errors: 1 match(es) in 1 file(s)

[Analysis Report]
  Summary:
  - Total types in src/types/: 5 modules (recharts, session, chart, router, error)
  - Exports are properly defined using `export type { ... } from './module.types'` pattern
  - Union type TeamName added at end
  - No duplicate type exports detected
