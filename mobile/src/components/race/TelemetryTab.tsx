import { useState, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { getDriverImage } from '../../lib/images';
import { request } from '../../lib/api';
import type { DetailedRaceResult } from '@fastlytics/shared';

type TelemetryType = 'speed' | 'throttle' | 'brake' | 'rpm' | 'drs' | 'gear';

const TELEMETRY_TYPES: { id: TelemetryType; label: string }[] = [
  { id: 'speed', label: 'Speed' },
  { id: 'throttle', label: 'Throttle' },
  { id: 'brake', label: 'Brake' },
  { id: 'rpm', label: 'RPM' },
  { id: 'drs', label: 'DRS' },
  { id: 'gear', label: 'Gear' },
];

export default function TelemetryTab({ year, eventSlug, session, results }: {
  year: number; eventSlug: string; session: string; results: DetailedRaceResult[];
}) {
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [telemetryType, setTelemetryType] = useState<TelemetryType>('speed');
  const [lapNumber, setLapNumber] = useState<string>('fastest');

  const topDrivers = useMemo(() => results.slice(0, 5), [results]);

  const { data: telemetryData, isLoading: telLoading } = useQuery<any[]>({
    queryKey: ['telemetry', year, eventSlug, session, selectedDriver, lapNumber, telemetryType],
    queryFn: () => request<Record<string, number>[]>(`/api/telemetry/${year}/${eventSlug}?session=${session}&driver=${selectedDriver}&lap=${lapNumber}&type=${telemetryType}`),
    enabled: !!year && !!eventSlug && !!session && !!selectedDriver && !!telemetryType,
  });

  const driverName = results.find(r => r.driverCode === selectedDriver)?.fullName || selectedDriver;

  return (
    <View style={{ gap: 12, paddingTop: 16 }}>
      {/* Driver Selector */}
      <Text style={{ fontSize: 9, fontWeight: '700', color: colors.gray500, letterSpacing: 1, textTransform: 'uppercase' }}>Select Driver</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {topDrivers.map(d => {
          const code = d.driverCode;
          const active = selectedDriver === code;
          return (
            <Pressable
              key={code}
              onPress={() => setSelectedDriver(active ? '' : code)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
                backgroundColor: active ? colors.red : 'rgba(255,255,255,0.05)',
                borderWidth: 1, borderColor: active ? colors.red : 'rgba(255,255,255,0.1)',
              }}
            >
              <View style={{ width: 16, height: 16, borderRadius: 3, overflow: 'hidden' }}>
                <Image source={{ uri: getDriverImage(code, year) }} style={{ width: '100%', height: '100%' }} contentFit="cover" contentPosition="top" />
              </View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: active ? '#fff' : colors.secondaryLabel }}>
                {code}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selectedDriver && (
        <>
          {/* Telemetry Type Tabs */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {TELEMETRY_TYPES.map(t => (
              <Pressable
                key={t.id}
                onPress={() => setTelemetryType(t.id)}
                style={{
                  paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
                  backgroundColor: telemetryType === t.id ? colors.red : 'rgba(255,255,255,0.05)',
                }}
              >
                <Text style={{
                  fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
                  color: telemetryType === t.id ? '#fff' : colors.secondaryLabel,
                }}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Metrics Display */}
          {telLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: colors.gray500 }}>Loading telemetry...</Text>
            </View>
          ) : telemetryData && telemetryData.length > 0 ? (
            <View style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
              <View style={{
                padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
                backgroundColor: colors.zinc900,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.gray500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {telemetryType.toUpperCase()} · Lap {lapNumber}
                </Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <Text style={{ fontSize: 10, color: colors.gray500 }}>{selectedDriver}</Text>
                </View>
              </View>

              {/* Data Summary */}
              {(() => {
                const values = telemetryData.map(d => d.value as number).filter(v => v != null);
                if (values.length === 0) return (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: colors.gray500 }}>No data points available</Text>
                  </View>
                );
                const min = Math.min(...values);
                const max = Math.max(...values);
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                const unit = telemetryType === 'speed' ? ' km/h' : telemetryType === 'rpm' ? ' RPM' : telemetryType === 'throttle' ? '%' : telemetryType === 'brake' ? '%' : '';

                return (
                  <View style={{ padding: 12, gap: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {[
                        { label: 'Max', value: `${Math.round(max)}${unit}` },
                        { label: 'Min', value: `${Math.round(min)}${unit}` },
                        { label: 'Avg', value: `${Math.round(avg)}${unit}` },
                      ].map(stat => (
                        <View key={stat.label} style={{
                          flex: 1, padding: 8, borderRadius: 8,
                          backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center',
                        }}>
                          <Text style={{ fontSize: 8, fontWeight: '700', color: colors.gray500, textTransform: 'uppercase' }}>{stat.label}</Text>
                          <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff' }}>{stat.value}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Simple bar visualization */}
                    <View style={{ height: 40, gap: 1 }}>
                      {(() => {
                        const sampleSize = Math.min(values.length, 60);
                        const step = Math.floor(values.length / sampleSize);
                        const sampled = values.filter((_, i) => i % step === 0).slice(0, sampleSize);
                        const color = telemetryType === 'speed' ? '#22c55e' : telemetryType === 'throttle' ? '#eab308' : telemetryType === 'brake' ? '#ef4444' : telemetryType === 'rpm' ? '#3b82f6' : telemetryType === 'drs' ? '#a855f7' : '#ec4899';
                        return (
                          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 1, flex: 1 }}>
                            {sampled.map((val, idx) => {
                              const pct = max > min ? (val - min) / (max - min) : 0.5;
                              return (
                                <View key={idx} style={{
                                  flex: 1, height: `${Math.max(pct * 100, 5)}%`,
                                  backgroundColor: color, borderRadius: 1,
                                  opacity: 0.7 + (pct * 0.3),
                                }} />
                              );
                            })}
                          </View>
                        );
                      })()}
                    </View>

                    <Text style={{ fontSize: 8, color: colors.gray600, textAlign: 'center' }}>
                      {telemetryData.length} data points · {telemetryType === 'speed' ? 'km/h' : telemetryType === 'rpm' ? 'RPM' : '%'}
                    </Text>
                  </View>
                );
              })()}
            </View>
          ) : (
            <View style={{ padding: 40, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12 }}>
              <Text style={{ color: colors.gray500, textAlign: 'center' }}>{selectedDriver ? 'No telemetry data available' : 'Select a driver to view telemetry'}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}
