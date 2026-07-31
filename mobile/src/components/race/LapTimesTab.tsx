import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { CartesianChart, Line, Scatter } from 'victory-native';
import { colors } from '../../theme/colors';
import { getDriverImage } from '../../lib/images';
import { fetchLapTimes } from '../../lib/api';
import type { DetailedRaceResult } from '@fastlytics/shared';

type LapTrendPoint = { lap: number; time: number; personalBest: number };

const formatLap = (seconds: number | null | undefined): string => {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(3).padStart(6, '0')}`;
};

export default function LapTimesTab({
  year,
  eventSlug,
  session,
  results,
}: {
  year: number;
  eventSlug: string;
  session: string;
  results: DetailedRaceResult[];
}) {
  const [selectedDriver, setSelectedDriver] = useState('');
  const topDrivers = useMemo(() => results.slice(0, 5), [results]);
  const activeDriver = selectedDriver || topDrivers[0]?.driverCode || '';

  const {
    data: lapTimeData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['lapTimes', year, eventSlug, session, activeDriver],
    queryFn: () => fetchLapTimes(year, eventSlug, session, activeDriver),
    enabled: !!year && !!eventSlug && !!session && !!activeDriver,
  });

  const lapTimes = useMemo(
    () => lapTimeData?.driverLapDetails[activeDriver] ?? [],
    [lapTimeData, activeDriver]
  );

  const trendData: LapTrendPoint[] = useMemo(
    () =>
      lapTimes
        .filter((lap) => lap.lapNumber != null && lap.lapTime != null)
        .map((lap) => ({
          lap: lap.lapNumber as number,
          time: lap.lapTime as number,
          personalBest: lap.isPersonalBest ? (lap.lapTime as number) : NaN,
        })),
    [lapTimes]
  );
  const trendTimes = trendData.map((point) => point.time);
  const trendMin = trendTimes.length ? Math.min(...trendTimes) : 0;
  const trendMax = trendTimes.length ? Math.max(...trendTimes) : 0;
  const trendPadding = Math.max((trendMax - trendMin) * 0.15, 0.2);

  return (
    <View style={{ gap: 12, paddingTop: 16 }}>
      <Text
        style={{
          fontSize: 9,
          fontWeight: '700',
          color: colors.gray500,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        Select driver
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {topDrivers.map((driver) => {
          const active = activeDriver === driver.driverCode;
          return (
            <Pressable
              key={driver.driverCode}
              onPress={() => setSelectedDriver(driver.driverCode)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 8,
                backgroundColor: active ? colors.red : 'rgba(255,255,255,0.05)',
                borderWidth: 1,
                borderColor: active ? colors.red : 'rgba(255,255,255,0.1)',
              }}
            >
              <View style={{ width: 16, height: 16, borderRadius: 3, overflow: 'hidden' }}>
                <Image
                  source={{ uri: getDriverImage(driver.driverCode, year) }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  contentPosition="top"
                />
              </View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: active ? '#fff' : colors.secondaryLabel,
                }}
              >
                {driver.driverCode}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator color={colors.red} />
        </View>
      ) : isError ? (
        <View
          style={{
            padding: 40,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.gray500, textAlign: 'center' }}>
            Lap data could not be loaded for this driver.
          </Text>
        </View>
      ) : lapTimes.length > 0 ? (
        <>
          {trendData.length > 1 && (
            <View
              style={{
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  padding: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(255,255,255,0.1)',
                  backgroundColor: colors.zinc900,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: colors.gray500,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Lap time trend
                </Text>
              </View>
              <View style={{ height: 140, padding: 12 }}>
                <CartesianChart
                  data={trendData}
                  xKey="lap"
                  yKeys={['time', 'personalBest']}
                  domain={{ y: [trendMin - trendPadding, trendMax + trendPadding] }}
                  padding={{ left: 4, right: 4, top: 8, bottom: 4 }}
                >
                  {({ points }) => {
                    const bestLapPoints = points.personalBest.filter((point) =>
                      Number.isFinite(point.y)
                    );
                    return (
                      <>
                        <Line
                          points={points.time}
                          color={colors.red}
                          strokeWidth={2}
                          curveType="linear"
                          animate={{ type: 'timing', duration: 300 }}
                        />
                        {bestLapPoints.length > 0 && (
                          <Scatter points={bestLapPoints} color="#22c55e" radius={3} />
                        )}
                      </>
                    );
                  }}
                </CartesianChart>
              </View>
            </View>
          )}
          <View
            style={{
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.1)',
                backgroundColor: colors.zinc900,
              }}
            >
              <Text style={{ width: 40, fontSize: 10, fontWeight: '700', color: colors.gray500 }}>
                Lap
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontSize: 10,
                  fontWeight: '700',
                  color: colors.gray500,
                  textAlign: 'right',
                }}
              >
                Time
              </Text>
              <Text
                style={{
                  width: 50,
                  fontSize: 10,
                  fontWeight: '700',
                  color: colors.gray500,
                  textAlign: 'right',
                }}
              >
                S1
              </Text>
              <Text
                style={{
                  width: 50,
                  fontSize: 10,
                  fontWeight: '700',
                  color: colors.gray500,
                  textAlign: 'right',
                }}
              >
                S2
              </Text>
              <Text
                style={{
                  width: 50,
                  fontSize: 10,
                  fontWeight: '700',
                  color: colors.gray500,
                  textAlign: 'right',
                }}
              >
                S3
              </Text>
              <Text
                style={{
                  width: 30,
                  fontSize: 10,
                  fontWeight: '700',
                  color: colors.gray500,
                  textAlign: 'right',
                }}
              >
                Pos
              </Text>
            </View>
            <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled>
              {lapTimes.map((lap, index) => (
                <View
                  key={lap.lapNumber ?? index}
                  style={{
                    flexDirection: 'row',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderBottomWidth: index < lapTimes.length - 1 ? 1 : 0,
                    borderBottomColor: 'rgba(255,255,255,0.05)',
                    backgroundColor: lap.isPersonalBest ? 'rgba(34,197,94,0.1)' : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      width: 40,
                      fontSize: 11,
                      fontWeight: '700',
                      color: lap.isPersonalBest ? '#22c55e' : colors.secondaryLabel,
                    }}
                  >
                    {lap.lapNumber ?? '—'}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 11,
                      fontVariant: ['tabular-nums'],
                      textAlign: 'right',
                      fontWeight: lap.isPersonalBest ? '700' : '400',
                      color: lap.isPersonalBest ? '#22c55e' : '#fff',
                    }}
                  >
                    {formatLap(lap.lapTime)}
                  </Text>
                  <Text
                    style={{
                      width: 50,
                      fontSize: 10,
                      fontVariant: ['tabular-nums'],
                      textAlign: 'right',
                      color: colors.gray500,
                    }}
                  >
                    {formatLap(lap.sector1)}
                  </Text>
                  <Text
                    style={{
                      width: 50,
                      fontSize: 10,
                      fontVariant: ['tabular-nums'],
                      textAlign: 'right',
                      color: colors.gray500,
                    }}
                  >
                    {formatLap(lap.sector2)}
                  </Text>
                  <Text
                    style={{
                      width: 50,
                      fontSize: 10,
                      fontVariant: ['tabular-nums'],
                      textAlign: 'right',
                      color: colors.gray500,
                    }}
                  >
                    {formatLap(lap.sector3)}
                  </Text>
                  <Text
                    style={{
                      width: 30,
                      fontSize: 11,
                      fontVariant: ['tabular-nums'],
                      textAlign: 'right',
                      color: colors.gray500,
                    }}
                  >
                    {lap.position ?? '-'}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </>
      ) : (
        <View
          style={{
            padding: 40,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.gray500, textAlign: 'center' }}>
            {activeDriver
              ? 'No lap time data is available for this driver.'
              : 'Select a driver to view lap-by-lap times.'}
          </Text>
        </View>
      )}
    </View>
  );
}
