import { useState, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { getDriverImage } from '../../lib/images';
import { request } from '../../lib/api';
import type { DetailedRaceResult, SectorComparisonData } from '@fastlytics/shared';

export default function HeadToHeadTab({ year, eventSlug, session, results }: {
  year: number; eventSlug: string; session: string; results: DetailedRaceResult[];
}) {
  const top10 = useMemo(() => results.slice(0, 10), [results]);
  const [d1, setD1] = useState(top10[0]?.driverCode || '');
  const [d2, setD2] = useState(top10[1]?.driverCode || '');

  const { data: sectorData } = useQuery<SectorComparisonData>({
    queryKey: ['sectorComparison', year, eventSlug, session, d1, d2],
    queryFn: () => request<SectorComparisonData>(`/api/sectors/${year}/${eventSlug}?session=${session}&driver1=${d1}&driver2=${d2}`),
    enabled: !!year && !!eventSlug && !!session && !!d1 && !!d2,
  });

  const r1 = results.find(r => r.driverCode === d1);
  const r2 = results.find(r => r.driverCode === d2);

  return (
    <View style={{ gap: 16, paddingTop: 16 }}>
      {/* Driver Selection */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: colors.gray500, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Driver 1</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {top10.map(d => (
              <Pressable
                key={d.driverCode}
                onPress={() => setD1(d.driverCode)}
                style={{
                  paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6,
                  backgroundColor: d1 === d.driverCode ? '#dc2626' : 'rgba(255,255,255,0.05)',
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '700', color: d1 === d.driverCode ? '#fff' : colors.secondaryLabel }}>{d.driverCode}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: colors.gray500, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Driver 2</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {top10.map(d => (
              <Pressable
                key={d.driverCode}
                onPress={() => setD2(d.driverCode)}
                style={{
                  paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6,
                  backgroundColor: d2 === d.driverCode ? '#2563eb' : 'rgba(255,255,255,0.05)',
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '700', color: d2 === d.driverCode ? '#fff' : colors.secondaryLabel }}>{d.driverCode}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Cards */}
      {r1 && r2 && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[r1, r2].map((r, idx) => (
            <View key={r.driverCode} style={{
              flex: 1, borderWidth: 2, borderRadius: 12, padding: 12, gap: 4,
              borderColor: idx === 0 ? '#dc2626' : '#2563eb',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden' }}>
                  <Image source={{ uri: getDriverImage(r.driverCode, year) }} style={{ width: '100%', height: '100%' }} contentFit="cover" contentPosition="top" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase' }}>{r.driverCode}</Text>
                  <Text style={{ fontSize: 9, color: colors.gray500 }} numberOfLines={1}>{r.team}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 10, color: colors.gray500 }}>Pos: #{r.position ?? '-'}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Section Comparison */}
      {sectorData?.sections && sectorData.sections.length > 0 ? (
        <View style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
          <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', backgroundColor: colors.zinc900 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.gray500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Sector Comparison
            </Text>
            <Text style={{ fontSize: 9, color: colors.gray600 }}>
              Driver {sectorData.driver1Code} vs {sectorData.driver2Code}
            </Text>
          </View>
          <View style={{
            flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12,
            borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
            backgroundColor: colors.zinc900,
          }}>
            <Text style={{ flex: 1, fontSize: 9, fontWeight: '700', color: colors.gray500, textTransform: 'uppercase' }}>Section</Text>
            <Text style={{ width: 32, fontSize: 9, fontWeight: '700', color: '#dc2626', textAlign: 'center' }}>D1</Text>
            <Text style={{ width: 32, fontSize: 9, fontWeight: '700', color: '#2563eb', textAlign: 'center' }}>D2</Text>
            <Text style={{ width: 36, fontSize: 9, fontWeight: '700', color: colors.gray500, textAlign: 'right' }}>Adv</Text>
          </View>
          {sectorData.sections.map((sec, idx) => (
            <View key={sec.id} style={{
              flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12,
              borderBottomWidth: idx < sectorData.sections.length - 1 ? 1 : 0,
              borderBottomColor: 'rgba(255,255,255,0.05)',
            }}>
              <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: colors.gray500 }}>{sec.name}</Text>
              <Text style={{ width: 32, fontSize: 11, fontVariant: ['tabular-nums'], textAlign: 'center', color: sec.driver1Advantage != null && sec.driver1Advantage > 0 ? '#dc2626' : colors.gray500 }}>
                {sec.driver1AvgSpeed != null ? Math.round(sec.driver1AvgSpeed) : '-'}
              </Text>
              <Text style={{ width: 32, fontSize: 11, fontVariant: ['tabular-nums'], textAlign: 'center', color: sec.driver2AvgSpeed != null && sec.driver2AvgSpeed > 0 ? '#2563eb' : colors.gray500 }}>
                {sec.driver2AvgSpeed != null ? Math.round(sec.driver2AvgSpeed) : '-'}
              </Text>
              <Text style={{
                width: 36, fontSize: 11, fontWeight: '700', textAlign: 'right',
                color: sec.driver1Advantage != null ? sec.driver1Advantage > 0 ? '#dc2626' : sec.driver1Advantage < 0 ? '#2563eb' : colors.gray500 : colors.gray500,
              }}>
                {sec.driver1Advantage != null ? `${sec.driver1Advantage > 0 ? '+' : ''}${sec.driver1Advantage.toFixed(2)}` : '-'}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ padding: 40, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12 }}>
          <Text style={{ color: colors.gray500, textAlign: 'center' }}>Select two drivers to compare their sector times and telemetry</Text>
        </View>
      )}
    </View>
  );
}
