import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../theme/colors';
import { useDriverStandings } from '../../api/hooks';
import { getDriverImage } from '../../lib/images';
import { getDriverSlug } from '@fastlytics/shared';

export default function DriverProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const season = new Date().getFullYear();
  const { data: standings, isLoading } = useDriverStandings(season);

  const driver = useMemo(
    () =>
      standings?.find(
        (entry) =>
          getDriverSlug(entry.code, entry.name) === slug?.toLowerCase() ||
          entry.code.toLowerCase() === slug?.toLowerCase()
      ) ?? null,
    [slug, standings]
  );

  if (!driver) {
    return (
      <View
        style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.red} />
        ) : (
          <Text style={{ color: colors.gray500 }}>Driver not found</Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#000' }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={{ paddingTop: 60, paddingHorizontal: 16 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontSize: 14, color: colors.red, fontWeight: '700' }}>← Back</Text>
        </Pressable>
      </View>

      <View style={{ alignItems: 'center', padding: 20, gap: 12 }}>
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 16,
            overflow: 'hidden',
            borderWidth: 3,
            borderColor: colors.red,
          }}
        >
          <Image
            source={{ uri: getDriverImage(driver.code, season) }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            contentPosition="top"
          />
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '900',
              textTransform: 'uppercase',
              fontStyle: 'italic',
            }}
          >
            {driver.name}
          </Text>
          <Text style={{ fontSize: 14, color: colors.gray500 }}>{driver.code}</Text>
          <Text style={{ fontSize: 12, color: colors.gray500 }}>{driver.team}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 }}>
        {[
          { label: 'Position', value: `#${driver.rank}` },
          { label: 'Points', value: String(driver.points) },
          { label: 'Wins', value: String(driver.wins) },
        ].map((stat) => (
          <View
            key={stat.label}
            style={{
              flex: 1,
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 12,
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: '700',
                color: colors.gray500,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {stat.label}
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.systemYellow }}>
              {stat.value}
            </Text>
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
