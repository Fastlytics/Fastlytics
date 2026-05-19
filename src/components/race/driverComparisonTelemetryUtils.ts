import type {
  ThrottleDataPoint,
  BrakeDataPoint,
  RPMDataPoint,
  DRSDataPoint,
  SpeedDataPoint,
  SpeedTraceResponse,
} from '@/lib/api';

export type TelemetryType = 'speed' | 'throttle' | 'brake' | 'rpm' | 'drs' | 'gap';
export type TelemetryDataPoint =
  | ThrottleDataPoint
  | BrakeDataPoint
  | RPMDataPoint
  | DRSDataPoint
  | SpeedDataPoint;

type TelemetryKey = 'Speed' | 'Throttle' | 'Brake' | 'RPM' | 'DRS';

function getTelemetryValue(
  point: TelemetryDataPoint,
  key: TelemetryKey
): number | null | undefined {
  if (key === 'Speed' && 'Speed' in point) return (point as SpeedDataPoint).Speed;
  if (key === 'Throttle' && 'Throttle' in point) return (point as ThrottleDataPoint).Throttle;
  if (key === 'Brake' && 'Brake' in point) return (point as BrakeDataPoint).Brake;
  if (key === 'RPM' && 'RPM' in point) return (point as RPMDataPoint).RPM;
  if (key === 'DRS' && 'DRS' in point) return (point as DRSDataPoint).DRS;
  return null;
}

function getDataKey(type: TelemetryType): TelemetryKey {
  switch (type) {
    case 'throttle':
      return 'Throttle';
    case 'brake':
      return 'Brake';
    case 'rpm':
      return 'RPM';
    case 'drs':
      return 'DRS';
    case 'speed':
    case 'gap':
    default:
      return 'Speed';
  }
}

function extractSpeedData(data: unknown): SpeedDataPoint[] {
  if (Array.isArray(data)) return data as SpeedDataPoint[];
  if (data && typeof data === 'object' && 'trace' in data) {
    return (data as SpeedTraceResponse).trace;
  }
  return [];
}

function findInterpolationPoints(distance: number, data: TelemetryDataPoint[]) {
  let beforePoint: TelemetryDataPoint | null = null;
  let afterPoint: TelemetryDataPoint | null = null;
  for (let index = 0; index < data.length; index++) {
    if (data[index].Distance <= distance) {
      beforePoint = data[index];
    } else {
      afterPoint = data[index];
      break;
    }
  }
  return { beforePoint, afterPoint };
}

function interpolateTelemetry(
  distance: number,
  data: TelemetryDataPoint[],
  key: TelemetryKey
): number | null {
  if (!data.length) return null;
  const exactMatch = data.find((point) => point.Distance === distance);
  if (exactMatch) {
    const value = getTelemetryValue(exactMatch, key);
    return value !== undefined ? value : null;
  }

  const { beforePoint, afterPoint } = findInterpolationPoints(distance, data);
  if (!beforePoint) {
    if (!afterPoint) return null;
    const value = getTelemetryValue(afterPoint, key);
    return value !== undefined ? value : null;
  }
  if (!afterPoint) {
    const value = getTelemetryValue(beforePoint, key);
    return value !== undefined ? value : null;
  }

  const beforeValue = getTelemetryValue(beforePoint, key);
  const afterValue = getTelemetryValue(afterPoint, key);
  if (beforeValue === null || beforeValue === undefined) return afterValue ?? null;
  if (afterValue === null || afterValue === undefined) return beforeValue;

  const distRatio =
    (distance - beforePoint.Distance) / (afterPoint.Distance - beforePoint.Distance);
  return beforeValue + distRatio * (afterValue - beforeValue);
}

function buildGapData(telemetryData1: TelemetryDataPoint[], telemetryData2: TelemetryDataPoint[]) {
  const calculateTime = (speedData: SpeedDataPoint[]) => {
    let time = 0;
    return speedData.map((point, index) => {
      if (index === 0) return { ...point, time: 0 };
      const previous = speedData[index - 1];
      const distanceDelta = point.Distance - previous.Distance;
      const averageSpeed = (point.Speed + previous.Speed) / 2 / 3.6;
      const timeDelta = averageSpeed > 0 ? distanceDelta / averageSpeed : 0;
      time += timeDelta;
      return { ...point, time };
    });
  };

  const timeData1 = calculateTime(extractSpeedData(telemetryData1));
  const timeData2 = calculateTime(extractSpeedData(telemetryData2));

  return timeData1.map((driver1Point) => {
    let driver2Time = 0;
    const exactMatch = timeData2.find((point) => point.Distance === driver1Point.Distance);
    if (exactMatch) {
      driver2Time = exactMatch.time;
    } else {
      const before = timeData2.filter((point) => point.Distance < driver1Point.Distance).pop();
      const after = timeData2.find((point) => point.Distance > driver1Point.Distance);
      if (before && after) {
        const ratio =
          (driver1Point.Distance - before.Distance) / (after.Distance - before.Distance);
        driver2Time = before.time + ratio * (after.time - before.time);
      } else if (before) {
        driver2Time = before.time;
      } else if (after) {
        driver2Time = after.time;
      }
    }
    return { Distance: driver1Point.Distance, Gap: driver1Point.time - driver2Time, Baseline: 0 };
  });
}

export function buildCombinedTelemetryData(
  telemetryData1: TelemetryDataPoint[] | undefined,
  telemetryData2: TelemetryDataPoint[] | undefined,
  telemetryType: TelemetryType,
  driver1: string,
  driver2: string
) {
  if (!telemetryData1 || !telemetryData2) return [];
  if (telemetryType === 'gap') return buildGapData(telemetryData1, telemetryData2);

  const dataKey = getDataKey(telemetryType);
  const baseData = telemetryData1.length > telemetryData2.length ? telemetryData1 : telemetryData2;
  const otherData = telemetryData1.length > telemetryData2.length ? telemetryData2 : telemetryData1;
  const isDriver1Base = telemetryData1.length > telemetryData2.length;

  return baseData.map((point) => {
    const distance = point.Distance;
    return {
      Distance: distance,
      [isDriver1Base ? driver1 : driver2]: getTelemetryValue(point, dataKey),
      [isDriver1Base ? driver2 : driver1]: interpolateTelemetry(distance, otherData, dataKey),
    };
  });
}

export function getTelemetryProps(telemetryType: TelemetryType) {
  switch (telemetryType) {
    case 'throttle':
      return {
        dataKey: 'Throttle',
        yAxisFormatter: (value: number) => `${value.toFixed(0)}%`,
        domain: [0, 100] as [number, number],
        tooltipUnit: '%',
        type: 'monotone' as const,
        showYAxisTicks: true,
        showActiveDot: true,
      };
    case 'brake':
      return {
        dataKey: 'Brake',
        yAxisFormatter: (value: number) => `${value.toFixed(0)}%`,
        domain: [0, 100] as [number, number],
        tooltipUnit: '%',
        type: 'monotone' as const,
        showYAxisTicks: true,
        showActiveDot: true,
      };
    case 'rpm':
      return {
        dataKey: 'RPM',
        yAxisFormatter: (value: number) => `${Math.round(value / 1000)}k`,
        domain: [0, 13000] as [number, number],
        tooltipUnit: ' RPM',
        type: 'monotone' as const,
        showYAxisTicks: true,
        showActiveDot: true,
      };
    case 'drs':
      return {
        dataKey: 'DRS',
        yAxisFormatter: (value: number) => (value === 1 ? 'ON' : 'OFF'),
        domain: [-0.1, 1.1] as [number, number],
        tooltipUnit: '',
        type: 'stepAfter' as const,
        showYAxisTicks: false,
        showActiveDot: false,
      };
    case 'speed':
      return {
        dataKey: 'Speed',
        yAxisFormatter: (value: number) => `${Math.round(value)}`,
        domain: ['auto', 'auto'] as [
          number | 'auto' | 'dataMin' | 'dataMax',
          number | 'auto' | 'dataMin' | 'dataMax',
        ],
        tooltipUnit: ' km/h',
        type: 'monotone' as const,
        showYAxisTicks: true,
        showActiveDot: true,
      };
    case 'gap':
      return {
        dataKey: 'Gap',
        yAxisFormatter: (value: number) => `${value.toFixed(2)}s`,
        domain: ['auto', 'auto'] as [
          number | 'auto' | 'dataMin' | 'dataMax',
          number | 'auto' | 'dataMin' | 'dataMax',
        ],
        tooltipUnit: 's',
        type: 'monotone' as const,
        showYAxisTicks: true,
        showActiveDot: true,
      };
    default:
      return {
        dataKey: 'Value',
        yAxisFormatter: (value: number) => `${value}`,
        domain: ['auto', 'auto'] as [
          number | 'auto' | 'dataMin' | 'dataMax',
          number | 'auto' | 'dataMin' | 'dataMax',
        ],
        tooltipUnit: '',
        type: 'monotone' as const,
        showYAxisTicks: true,
        showActiveDot: true,
      };
  }
}
