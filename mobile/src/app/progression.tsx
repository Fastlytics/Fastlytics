import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../theme/colors';
import { request } from '../lib/api';
import { getDriverImage } from '../lib/images';

export default function ProgressionScreen() {
  const [season, setSeason] = useState(new Date().getFullYear());
  const [type, setType] = useState<'drivers' | 'teams'>('drivers');

  const { data: standings, isLoading } = useQuery<any[]>({
    queryKey: ['championshipProgression', season],
    queryFn: () => request<any[]>(`/api/standings/progression/${season}?type=${type}`),
    enabled: !!season,
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingTop: 60, paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ fontSize: 14, color: colors.red, fontWeight: '700' }}>← Back</Text>
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>Progression</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8 }}>
        {['drivers', 'teams'].map(t => (
          <Pressable
            key={t}
            onPress={() => setType(t as any)}
            style={{
              paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8,
              backgroundColor: type === t ? colors.red : 'rgba(255,255,255,0.05)',
            }}
          >
            <Text style={{ fontWeight: '700', fontSize: 12, textTransform: 'capitalize', color: type === t ? '#fff' : colors.secondaryLabel }}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}>
        {isLoading ? (
          <View style={{ padding: 32, alignItems: 'center' }}><ActivityIndicator color={colors.red} /></View>
        ) : standings && standings.length > 0 ? (
          standings.map((entry, idx) => {
            const points = entry.points || entry.points_history || [];
            const total = Array.isArray(points) ? points.reduce((a: number, b: number) => a + b, 0) : points;
            const code = entry.driverCode || entry.code || entry.name;
            return (
              <View key={idx} style={{
                borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12,
                padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
              }}>
                <View style={{ width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
                  <Image source={{ uri: getDriverImage(code, season) }} style={{ width: '100%', height: '100%' }} contentFit="cover" contentPosition="top" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', fontSize: 13, textTransform: 'uppercase' }}>{entry.name || code}</Text>
                  <Text style={{ fontSize: 10, color: colors.gray500 }}>Season {season}</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.systemYellow }}>{total} pts</Text>
              </View>
            );
          })
        ) : (
          <Text style={{ color: colors.gray500, textAlign: 'center', padding: 40 }}>Progression data not available</Text>
        )}
      </ScrollView>
    </View>
  );
}
