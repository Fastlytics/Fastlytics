import { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../theme/colors';
import { request } from '../lib/api';
import { getTeamLogo } from '@fastlytics/shared';

export default function TeamsScreen() {
  const season = new Date().getFullYear();

  const { data: standings, isLoading } = useQuery<any[]>({
    queryKey: ['teamStandings', season],
    queryFn: () => request<any[]>(`/api/standings/teams/${season}`),
    enabled: true,
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingTop: 60, paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ fontSize: 14, color: colors.red, fontWeight: '700' }}>← Back</Text>
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>Teams</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}>
        {isLoading ? (
          <View style={{ padding: 32, alignItems: 'center' }}><ActivityIndicator color={colors.red} /></View>
        ) : standings && standings.length > 0 ? (
          standings.map((team, idx) => (
            <Pressable
              key={team.constructorId || team.code || idx}
              onPress={() => router.push(`/team/${encodeURIComponent((team.slug || team.name || '').toLowerCase().replace(/\s+/g, '-'))}`)}
              style={{
                borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12,
                padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
              }}
            >
              <View style={{ width: 32, height: 22, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: idx < 3 ? colors.systemYellow : 'transparent' }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: idx < 3 ? '#000' : colors.gray500 }}>{team.position || idx + 1}</Text>
              </View>
              <View style={{ width: 48, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18 }}>{getTeamLogo(team.name || team.constructorName)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 13, textTransform: 'uppercase' }}>{team.name || team.constructorName}</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '900', color: colors.systemYellow }}>{team.points || 0}</Text>
            </Pressable>
          ))
        ) : (
          <Text style={{ color: colors.gray500, textAlign: 'center', padding: 40 }}>Team data not available</Text>
        )}
      </ScrollView>
    </View>
  );
}
