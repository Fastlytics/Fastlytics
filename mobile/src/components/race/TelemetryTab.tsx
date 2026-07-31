import { useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { CartesianChart, Area, Line } from 'victory-native';
import { LinearGradient, vec } from '@shopify/react-native-skia';
import { colors } from '../../theme/colors';
import { getDriverImage } from '../../lib/images';
import { fetchTelemetrySeries, type TelemetryMetric } from '../../lib/api';
import type { DetailedRaceResult } from '@fastlytics/shared';

const telemetryTypes: { id: TelemetryMetric; label: string }[] = [
  { id: 'speed', label: 'Speed' },
  { id: 'throttle', label: 'Throttle' },
  { id: 'brake', label: 'Brake' },
  { id: 'rpm', label: 'RPM' },
  { id: 'drs', label: 'DRS' },
  { id: 'gear', label: 'Gear' },
];

type TelemetryChartPoint = { distance: number; value: number; [key: string]: number };

const metricUnit = (metric: TelemetryMetric) =>
  metric === 'speed'
    ? ' km/h'
    : metric === 'rpm'
      ? ' RPM'
      : metric === 'throttle' || metric === 'brake'
        ? '%'
        : '';
const metricColor = (metric: TelemetryMetric): string =>
  ({
    speed: '#22c55e',
    throttle: '#eab308',
    brake: '#ef4444',
    rpm: '#3b82f6',
    drs: '#a855f7',
    gear: '#ec4899',
  })[metric];

export default function TelemetryTab({
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
  const [telemetryType, setTelemetryType] = useState<TelemetryMetric>('speed');
  const topDrivers = useMemo(() => results.slice(0, 5), [results]);
  const availableTypes = useMemo(
    () => telemetryTypes.filter((type) => !(year >= 2026 && type.id === 'drs')),
    [year]
  );
  const activeDriver = selectedDriver || topDrivers[0]?.driverCode || '';
  const activeTelemetryType = availableTypes.some((type) => type.id === telemetryType)
    ? telemetryType
    : 'speed';

  const {
    data: telemetryData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['telemetry', year, eventSlug, session, activeDriver, 'fastest', activeTelemetryType],
    queryFn: () =>
      fetchTelemetrySeries(year, eventSlug, session, activeDriver, 'fastest', activeTelemetryType),
    enabled: !!year && !!eventSlug && !!session && !!activeDriver,
  });

  const values = telemetryData?.map((point) => point.value) ?? [];
  const minimum = values.length ? Math.min(...values) : 0;
  const maximum = values.length ? Math.max(...values) : 0;
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const chartData: TelemetryChartPoint[] = useMemo(
    () => (telemetryData ?? []).map((point) => ({ distance: point.distance, value: point.value })),
    [telemetryData]
  );
  const chartColor = metricColor(activeTelemetryType);
  const yPadding = Math.max((maximum - minimum) * 0.1, 1);
  const curveType =
    activeTelemetryType === 'gear' || activeTelemetryType === 'drs' ? 'stepAfter' : 'natural';

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

      {activeDriver && (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {availableTypes.map((type) => (
              <Pressable
                key={type.id}
                onPress={() => setTelemetryType(type.id)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor:
                    activeTelemetryType === type.id ? colors.red : 'rgba(255,255,255,0.05)',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: activeTelemetryType === type.id ? '#fff' : colors.secondaryLabel,
                  }}
                >
                  {type.label}
                </Text>
              </Pressable>
            ))}
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
                Telemetry is not available for this lap.
              </Text>
            </View>
          ) : values.length > 0 ? (
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
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
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
                  {activeTelemetryType} · fastest lap
                </Text>
                <Text style={{ fontSize: 10, color: colors.gray500 }}>{activeDriver}</Text>
              </View>
              <View style={{ padding: 12, gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    {
                      label: 'Max',
                      value: `${Math.round(maximum)}${metricUnit(activeTelemetryType)}`,
                    },
                    {
                      label: 'Min',
                      value: `${Math.round(minimum)}${metricUnit(activeTelemetryType)}`,
                    },
                    {
                      label: 'Avg',
                      value: `${Math.round(average)}${metricUnit(activeTelemetryType)}`,
                    },
                  ].map((stat) => (
                    <View
                      key={stat.label}
                      style={{
                        flex: 1,
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 8,
                          fontWeight: '700',
                          color: colors.gray500,
                          textTransform: 'uppercase',
                        }}
                      >
                        {stat.label}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff' }}>
                        {stat.value}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={{ height: 160 }}>
                  <CartesianChart
                    data={chartData}
                    xKey="distance"
                    yKeys={['value']}
                    domain={{ y: [minimum - yPadding, maximum + yPadding] }}
                    padding={{ left: 4, right: 4, top: 8, bottom: 4 }}
                  >
                    {({ points, chartBounds }) => (
                      <>
                        <Area
                          points={points.value}
                          y0={chartBounds.bottom}
                          curveType={curveType}
                          animate={{ type: 'timing', duration: 300 }}
                        >
                          <LinearGradient
                            start={vec(0, chartBounds.top)}
                            end={vec(0, chartBounds.bottom)}
                            colors={[`${chartColor}55`, `${chartColor}00`]}
                          />
                        </Area>
                        <Line
                          points={points.value}
                          color={chartColor}
                          strokeWidth={2}
                          curveType={curveType}
                          animate={{ type: 'timing', duration: 300 }}
                        />
                      </>
                    )}
                  </CartesianChart>
                </View>
                <Text style={{ fontSize: 8, color: colors.gray600, textAlign: 'center' }}>
                  {values.length} data points · {metricUnit(activeTelemetryType).trim() || 'state'}
                </Text>
              </View>
            </View>
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
                No telemetry data is available for this lap.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}
