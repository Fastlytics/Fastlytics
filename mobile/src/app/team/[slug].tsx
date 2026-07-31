import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../theme/colors';
import { useTeamStandings } from '../../api/hooks';
import { getCarImage } from '../../lib/images';
import { getTeamSlug } from '@fastlytics/shared';

export default function TeamProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const season = new Date().getFullYear();
  const { data: standings, isLoading } = useTeamStandings(season);

  const team = useMemo(
    () => standings?.find((entry) => getTeamSlug(entry.team) === slug?.toLowerCase()) ?? null,
    [slug, standings]
  );

  if (!team) {
    return (
      <View
        style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.red} />
        ) : (
          <Text style={{ color: colors.gray500 }}>Team not found</Text>
        )}
      </View>
    );
  }

  const carImage = getCarImage(team.team, season);

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
            width: 112,
            height: 80,
            borderRadius: 16,
            backgroundColor: colors.zinc900,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 3,
            borderColor: colors.red,
            padding: 8,
          }}
        >
          {carImage ? (
            <Image
              source={{ uri: carImage }}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
            />
          ) : (
            <Text style={{ fontSize: 30, color: colors.gray500, fontWeight: '900' }}>
              {team.team.charAt(0)}
            </Text>
          )}
        </View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '900',
            textTransform: 'uppercase',
            fontStyle: 'italic',
          }}
        >
          {team.team}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 }}>
        {[
          { label: 'Position', value: `#${team.rank}` },
          { label: 'Points', value: String(team.points) },
          { label: 'Wins', value: String(team.wins) },
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
          Team biography and detailed season statistics are available on the web version.
        </Text>
      </View>
    </ScrollView>
  );
}
