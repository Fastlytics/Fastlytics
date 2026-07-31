import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../theme/colors';
import { fetchChampionshipProgression } from '../lib/api';
import { getDriverImage } from '../lib/images';

const progressionTypes = ['drivers', 'teams'] as const;
type ProgressionType = (typeof progressionTypes)[number];

export default function ProgressionScreen() {
  const [season] = useState(new Date().getFullYear());
  const [type, setType] = useState<ProgressionType>('drivers');

  const {
    data: progression,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['championshipProgression', season],
    queryFn: () => fetchChampionshipProgression(season),
    enabled: type === 'drivers',
  });

  const drivers = useMemo(
    () =>
      Object.entries(progression?.drivers ?? {})
        .map(([code, driver]) => ({
          code,
          ...driver,
          points: driver.points_history[driver.points_history.length - 1] ?? 0,
        }))
        .sort((left, right) => right.points - left.points),
    [progression]
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingTop: 60, paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ fontSize: 14, color: colors.red, fontWeight: '700' }}>← Back</Text>
          </Pressable>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '900',
              textTransform: 'uppercase',
              fontStyle: 'italic',
            }}
          >
            Progression
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8 }}>
        {progressionTypes.map((item) => (
          <Pressable
            key={item}
            onPress={() => setType(item)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: type === item ? colors.red : 'rgba(255,255,255,0.05)',
            }}
          >
            <Text
              style={{
                fontWeight: '700',
                fontSize: 12,
                textTransform: 'capitalize',
                color: type === item ? '#fff' : colors.secondaryLabel,
              }}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}
      >
        {type === 'teams' ? (
          <View
            style={{
              padding: 28,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              gap: 6,
            }}
          >
            <Text style={{ color: colors.secondaryLabel, fontWeight: '700' }}>
              Constructor progression is coming soon
            </Text>
            <Text style={{ color: colors.gray500, textAlign: 'center', fontSize: 12 }}>
              The current API provides driver progression only, so this screen avoids showing empty
              or misleading constructor data.
            </Text>
          </View>
        ) : isLoading ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <ActivityIndicator color={colors.red} />
          </View>
        ) : isError ? (
          <Text style={{ color: colors.gray500, textAlign: 'center', padding: 40 }}>
            Championship progression could not be loaded.
          </Text>
        ) : drivers.length > 0 ? (
          <>
            <Text style={{ color: colors.gray500, fontSize: 11 }}>
              {progression?.rounds.length ?? 0} rounds completed
            </Text>
            {drivers.map((driver, index) => (
              <View
                key={driver.code}
                style={{
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Text style={{ width: 18, color: colors.gray500, fontWeight: '900' }}>
                  {index + 1}
                </Text>
                <View style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden' }}>
                  <Image
                    source={{ uri: getDriverImage(driver.code, season) }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    contentPosition="top"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', fontSize: 13, textTransform: 'uppercase' }}>
                    {driver.name}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.gray500 }}>{driver.team}</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.systemYellow }}>
                  {driver.points} pts
                </Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={{ color: colors.gray500, textAlign: 'center', padding: 40 }}>
            Progression data is not available for this season.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
