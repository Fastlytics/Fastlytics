import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { getDriverImage } from '../../lib/images';
import { request } from '../../lib/api';
import type { DetailedRaceResult, LapTimeDataPoint } from '@fastlytics/shared';

const formatLap = (s: number | null | undefined): string => {
  if (s == null || isNaN(s)) return '—';
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3);
  return `${m}:${sec.padStart(6, '0')}`;
};

export default function LapTimesTab({ year, eventSlug, session, results }: {
  year: number; eventSlug: string; session: string; results: DetailedRaceResult[];
}) {
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const topDrivers = useMemo(() => results.slice(0, 5), [results]);

  const { data: lapTimes } = useQuery<any[]>({
    queryKey: ['lapTimes', year, eventSlug, session, selectedDriver],
    queryFn: () => request<any[]>(`/api/laps/${year}/${eventSlug}?session=${session}&driver=${selectedDriver}`),
    enabled: !!year && !!eventSlug && !!session && !!selectedDriver,
  });

  return (
    <View style={{ gap: 12, paddingTop: 16 }}>
      {/* Driver Selector */}
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

      {/* Lap Time Table */}
      {selectedDriver && lapTimes && lapTimes.length > 0 ? (
        <View style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
          <View style={{
            flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12,
            borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
            backgroundColor: colors.zinc900,
          }}>
            <Text style={{ width: 40, fontSize: 10, fontWeight: '700', color: colors.gray500 }}>Lap</Text>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', color: colors.gray500, textAlign: 'right' }}>Time</Text>
            <Text style={{ width: 50, fontSize: 10, fontWeight: '700', color: colors.gray500, textAlign: 'right' }}>S1</Text>
            <Text style={{ width: 50, fontSize: 10, fontWeight: '700', color: colors.gray500, textAlign: 'right' }}>S2</Text>
            <Text style={{ width: 50, fontSize: 10, fontWeight: '700', color: colors.gray500, textAlign: 'right' }}>S3</Text>
            <Text style={{ width: 30, fontSize: 10, fontWeight: '700', color: colors.gray500, textAlign: 'right' }}>Pos</Text>
          </View>
          <ScrollView style={{ maxHeight: 400 }}>
            {lapTimes.map((lap, idx) => {
          const isPersonalBest = false;
          const isFastestOfRace = false;
              return (
                <View key={lap.lapNumber || idx} style={{
                  flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12,
                  borderBottomWidth: idx < lapTimes.length - 1 ? 1 : 0,
                  borderBottomColor: 'rgba(255,255,255,0.05)',
                  backgroundColor: isFastestOfRace ? 'rgba(220,38,38,0.1)' : 'transparent',
                }}>
              <Text style={{ width: 40, fontSize: 11, fontWeight: '700', color: isFastestOfRace ? '#eab308' : colors.secondaryLabel }}>
                {lap.LapNumber}
              </Text>
              <Text style={{ flex: 1, fontSize: 11, fontVariant: ['tabular-nums'], textAlign: 'right', fontWeight: isPersonalBest ? '700' : '400', color: isPersonalBest ? '#22c55e' : '#fff' }}>
                {formatLap(lap[selectedDriver] as number | null)}
              </Text>
              <Text style={{ width: 50, fontSize: 10, fontVariant: ['tabular-nums'], textAlign: 'right', color: colors.gray500 }}>
                {formatLap(lap.S1 as number | null)}
              </Text>
              <Text style={{ width: 50, fontSize: 10, fontVariant: ['tabular-nums'], textAlign: 'right', color: colors.gray500 }}>
                {formatLap(lap.S2 as number | null)}
              </Text>
              <Text style={{ width: 50, fontSize: 10, fontVariant: ['tabular-nums'], textAlign: 'right', color: colors.gray500 }}>
                {formatLap(lap.S3 as number | null)}
              </Text>
              <Text style={{ width: 30, fontSize: 11, fontVariant: ['tabular-nums'], textAlign: 'right', color: colors.gray500 }}>
                {lap.Position || '-'}
              </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      ) : selectedDriver ? (
        <View style={{ padding: 40, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12 }}>
          <Text style={{ color: colors.gray500, textAlign: 'center' }}>No lap time data available{'\n'}Select a driver to view lap-by-lap times</Text>
        </View>
      ) : (
        <View style={{ padding: 40, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12 }}>
          <Text style={{ color: colors.gray500, textAlign: 'center' }}>Tap a driver above to view their lap times</Text>
        </View>
      )}
    </View>
  );
}
