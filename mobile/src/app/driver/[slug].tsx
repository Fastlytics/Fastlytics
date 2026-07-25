import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { request } from '../../lib/api';
import { getDriverImage } from '../../lib/images';

export default function DriverProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const season = new Date().getFullYear();

  const { data: standings } = useQuery<any[]>({
    queryKey: ['driverStandings', season],
    queryFn: () => request<any[]>(`/api/standings/drivers/${season}`),
  });

  const driver = useMemo(() => {
    if (!standings) return null;
    return standings.find((d: any) =>
      (d.driverSlug || '').toLowerCase() === slug?.toLowerCase() ||
      (d.driver || '').toLowerCase().replace(/\s+/g, '-') === slug?.toLowerCase()
    );
  }, [standings, slug]);

  if (!driver) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        {standings ? <Text style={{ color: colors.gray500 }}>Driver not found</Text> : <ActivityIndicator color={colors.red} />}
      </View>
    );
  }

  const code = driver.driverCode || driver.code;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ paddingTop: 60, paddingHorizontal: 16 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontSize: 14, color: colors.red, fontWeight: '700' }}>← Back</Text>
        </Pressable>
      </View>

      {/* Hero */}
      <View style={{ alignItems: 'center', padding: 20, gap: 12 }}>
        <View style={{ width: 100, height: 100, borderRadius: 16, overflow: 'hidden', borderWidth: 3, borderColor: colors.red }}>
          <Image source={{ uri: getDriverImage(code, season) }} style={{ width: '100%', height: '100%' }} contentFit="cover" contentPosition="top" />
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>{driver.driver || driver.name}</Text>
          <Text style={{ fontSize: 14, color: colors.gray500 }}>{code}</Text>
          <Text style={{ fontSize: 12, color: colors.gray500 }}>{driver.team || driver.constructorName}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 }}>
        {[
          { label: 'Position', value: `#${driver.position || '-'}` },
          { label: 'Points', value: String(driver.points || 0) },
          { label: 'Wins', value: String(driver.wins || driver.seasonWins || 0) },
        ].map(stat => (
          <View key={stat.label} style={{
            flex: 1, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12,
            padding: 12, alignItems: 'center', gap: 4,
          }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: colors.gray500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.systemYellow }}>{stat.value}</Text>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 11, color: colors.gray500, lineHeight: 18 }}>
          Driver biography and detailed season statistics are available on the web version.
        </Text>
      </View>
    </ScrollView>
  );
}
