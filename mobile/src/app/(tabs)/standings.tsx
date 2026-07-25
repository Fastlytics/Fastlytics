import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { useDriverStandings, useTeamStandings } from '../../api/hooks';
import { getDriverImage, getCarImage } from '../../lib/images';
import type { DriverStanding, TeamStanding } from '@fastlytics/shared';

function DriverRow({ driver, index, drivers }: { driver: DriverStanding; index: number; drivers: DriverStanding[] }) {
  const isLeader = index === 0;
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
    }}>
      <View style={{
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderRadius: 6,
        backgroundColor: isLeader ? colors.systemYellow : colors.zinc900,
        borderColor: isLeader ? colors.systemYellow : 'rgba(255,255,255,0.1)',
      }}>
        <Text style={{
          fontSize: 13,
          fontWeight: '900',
          color: isLeader ? '#000' : colors.gray500,
        }}>
          {index + 1}
        </Text>
      </View>

      <View style={{
        width: 44,
        height: 44,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        backgroundColor: colors.zinc900,
      }}>
        <Image
          source={{ uri: getDriverImage(driver.code, 2025) }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          contentPosition="top"
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase', fontStyle: 'italic' }} numberOfLines={1}>
          {driver.name.split(' ').pop()}
        </Text>
        <Text style={{ fontSize: 10, color: colors.gray500 }} numberOfLines={1}>
          {driver.team}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '900',
          fontVariant: ['tabular-nums'],
          color: isLeader ? colors.systemYellow : '#fff',
        }}>
          {driver.points}
        </Text>
        {index > 0 && (
          <Text style={{ fontSize: 9, color: colors.gray600 }}>
            -{drivers[0]?.points - driver.points}
          </Text>
        )}
      </View>
    </View>
  );
}

function TeamRow({ team, index, teams }: { team: TeamStanding; index: number; teams: TeamStanding[] }) {
  const isLeader = index === 0;
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
    }}>
      <View style={{
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderRadius: 6,
        backgroundColor: isLeader ? colors.systemYellow : colors.zinc900,
        borderColor: isLeader ? colors.systemYellow : 'rgba(255,255,255,0.1)',
      }}>
        <Text style={{ fontSize: 13, fontWeight: '900', color: isLeader ? '#000' : colors.gray500 }}>
          {index + 1}
        </Text>
      </View>

      <View style={{
        width: 60,
        height: 40,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
      }}>
        <Image
          source={{ uri: getCarImage(team.team, 2025) }}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase', fontStyle: 'italic' }} numberOfLines={1}>
          {team.team}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '900',
          fontVariant: ['tabular-nums'],
          color: isLeader ? colors.systemYellow : '#fff',
        }}>
          {team.points}
        </Text>
        {index > 0 && (
          <Text style={{ fontSize: 9, color: colors.gray600 }}>
            -{teams[0]?.points - team.points}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function StandingsScreen() {
  const [activeTab, setActiveTab] = useState<'drivers' | 'teams'>('drivers');
  const [selectedYear] = useState(new Date().getFullYear());

  const { data: drivers, isLoading: loadingDrivers } = useDriverStandings(selectedYear);
  const { data: teams, isLoading: loadingTeams } = useTeamStandings(selectedYear);

  const isLoading = loadingDrivers || loadingTeams;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#000' }}
    >
      {/* Season title */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>
          {selectedYear} Season
        </Text>
      </View>

      {/* Tab selector */}
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginVertical: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 6 }}>
        <Pressable
          onPress={() => setActiveTab('drivers')}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: 'center',
            borderRadius: 8,
            backgroundColor: activeTab === 'drivers' ? colors.red : 'transparent',
          }}
        >
          <Text style={{
            fontSize: 12,
            fontWeight: '900',
            textTransform: 'uppercase',
            fontStyle: 'italic',
            color: activeTab === 'drivers' ? '#fff' : colors.gray500,
          }}>
            Drivers
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('teams')}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: 'center',
            borderRadius: 8,
            backgroundColor: activeTab === 'teams' ? colors.red : 'transparent',
          }}
        >
          <Text style={{
            fontSize: 12,
            fontWeight: '900',
            textTransform: 'uppercase',
            fontStyle: 'italic',
            color: activeTab === 'teams' ? '#fff' : colors.gray500,
          }}>
            Constructors
          </Text>
        </Pressable>
      </View>

      {/* Standings content */}
      <View style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginHorizontal: 16, marginTop: 4, overflow: 'hidden' }}>
        {isLoading ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <ActivityIndicator color={colors.red} />
          </View>
        ) : activeTab === 'drivers' ? (
          (drivers ?? []).map((driver, idx) => (
            <DriverRow key={driver.code} driver={driver} index={idx} drivers={drivers ?? []} />
          ))
        ) : (
          (teams ?? []).map((team, idx) => (
            <TeamRow key={team.team} team={team} index={idx} teams={teams ?? []} />
          ))
        )}
      </View>
    </ScrollView>
  );
}
