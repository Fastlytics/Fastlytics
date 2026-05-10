export function interpolateSeriesValue(timeline: number[], values: number[], time: number) {
  if (!timeline.length || !values.length) return 0;
  if (time <= timeline[0]) return values[0] ?? 0;
  const lastIndex = Math.min(timeline.length, values.length) - 1;
  if (time >= timeline[lastIndex]) return values[lastIndex] ?? 0;

  let low = 0;
  let high = lastIndex;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const sampleTime = timeline[mid];

    if (sampleTime === time) return values[mid] ?? 0;
    if (sampleTime < time) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const prevIndex = Math.max(0, high);
  const nextIndex = Math.min(lastIndex, low);
  const prevTime = timeline[prevIndex];
  const nextTime = timeline[nextIndex];
  const prevValue = values[prevIndex] ?? 0;
  const nextValue = values[nextIndex] ?? prevValue;
  const alpha = nextTime === prevTime ? 0 : (time - prevTime) / (nextTime - prevTime);

  return prevValue + (nextValue - prevValue) * alpha;
}

export function sampleRecentSeries(
  timeline: number[] | undefined,
  values: number[] | undefined,
  currentTime: number,
  durationSeconds = 6,
  sampleCount = 150
) {
  if (!timeline?.length || !values?.length) return [];

  const startTime = Math.max(timeline[0], currentTime - durationSeconds);
  const endTime = Math.min(currentTime, timeline[Math.min(timeline.length, values.length) - 1]);
  if (endTime <= startTime) return [interpolateSeriesValue(timeline, values, endTime)];

  return Array.from({ length: sampleCount }, (_, index) => {
    const alpha = sampleCount === 1 ? 1 : index / (sampleCount - 1);
    return interpolateSeriesValue(timeline, values, startTime + (endTime - startTime) * alpha);
  });
}

export const normalizeBrakeValue = (value: number) =>
  Number.isFinite(value) && value >= 0 && value <= 1 ? value * 100 : value;

export const normalizeBrakeSeries = (values: number[] | undefined) =>
  values?.map((value) => normalizeBrakeValue(value)) ?? [];

export function findSectorBoundaryTime(
  timeline: number[] | undefined,
  laps: number[] | undefined,
  relativeDistances: number[] | undefined,
  lap: number,
  boundary: number,
  fallbackTime: number
) {
  if (!timeline?.length || !laps?.length || !relativeDistances?.length) return fallbackTime;
  if (boundary <= 0) return fallbackTime;

  const limit = Math.min(timeline.length, laps.length, relativeDistances.length);
  for (let i = 1; i < limit; i++) {
    if (laps[i] !== lap) continue;

    const previousRel = laps[i - 1] === lap ? relativeDistances[i - 1] : 0;
    const currentRel = relativeDistances[i];
    if (previousRel <= boundary && currentRel >= boundary) {
      const span = currentRel - previousRel;
      const alpha = span === 0 ? 0 : (boundary - previousRel) / span;
      return timeline[i - 1] + (timeline[i] - timeline[i - 1]) * alpha;
    }
  }

  return fallbackTime;
}
