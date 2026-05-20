export type PngExportPreset =
  | 'instagram-square'
  | 'instagram-portrait'
  | 'instagram-story'
  | 'landscape';

export interface PngExportPresetSpec {
  label: string;
  description: string;
  width: number;
  height: number;
}

export const PNG_EXPORT_PRESETS: Record<PngExportPreset, PngExportPresetSpec> = {
  'instagram-square': {
    label: 'Instagram Square',
    description: '1080 x 1080',
    width: 1080,
    height: 1080,
  },
  'instagram-portrait': {
    label: 'Instagram Portrait',
    description: '1080 x 1350',
    width: 1080,
    height: 1350,
  },
  'instagram-story': {
    label: 'Instagram Story',
    description: '1080 x 1920',
    width: 1080,
    height: 1920,
  },
  landscape: {
    label: 'Landscape',
    description: '1600 x 900',
    width: 1600,
    height: 900,
  },
};

export const PNG_EXPORT_PRESET_ORDER: PngExportPreset[] = [
  'instagram-square',
  'instagram-portrait',
  'instagram-story',
  'landscape',
];

export const DEFAULT_PNG_EXPORT_PRESET: PngExportPreset = 'instagram-square';

export interface TeamPaceGapExportMeta {
  title: string;
  subtitle: string;
  year: number;
  event: string;
  session: string;
}

export interface TeamPaceGapExportRow {
  teamName: string;
  medianTime: number;
  gapToLeader: number;
  rank?: number | null;
  teamColor: string;
}

export interface TeamPaceGapExportPayload {
  preset: PngExportPreset;
  meta: TeamPaceGapExportMeta;
  rows: TeamPaceGapExportRow[];
}
