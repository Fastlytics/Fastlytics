import { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Host, Column, Row, Text as UIText, List, ListItem, RNHostView } from '@expo/ui';
import SegmentedControl from '@expo/ui/community/segmented-control';
import { colors } from '../../theme/colors';
import { useDriverStandings, useTeamStandings } from '../../api/hooks';
import { getDriverImage, getCarImage } from '../../lib/images';
import type { DriverStanding, TeamStanding } from '@fastlytics/shared';

function DriverListItem({
  driver,
  index,
  leaderPoints,
}: {
  driver: DriverStanding;
  index: number;
  leaderPoints: number;
}) {
  const isLeader = index === 0;
  return (
    <ListItem
      leading={
        <Row alignment="center" spacing={12}>
          <Column
            alignment="center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              backgroundColor: isLeader
                ? (colors.systemYellow as string)
                : (colors.zinc900 as string),
            }}
          >
            <UIText
              textStyle={{
                fontSize: 13,
                fontWeight: '900',
                color: isLeader ? '#000' : (colors.gray500 as string),
              }}
            >
              {String(index + 1)}
            </UIText>
          </Column>
          <RNHostView>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.1)',
                overflow: 'hidden',
                backgroundColor: colors.zinc900,
              }}
            >
              <Image
                source={{ uri: getDriverImage(driver.code, 2025) }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                contentPosition="top"
              />
            </View>
          </RNHostView>
        </Row>
      }
      supportingText={driver.team}
      trailing={
        <Column alignment="end">
          <UIText
            textStyle={{
              fontSize: 18,
              fontWeight: '900',
              color: isLeader ? (colors.systemYellow as string) : '#fff',
            }}
          >
            {String(driver.points)}
          </UIText>
          {index > 0 && (
            <UIText textStyle={{ fontSize: 9, color: colors.gray600 as string }}>
              {`-${leaderPoints - driver.points}`}
            </UIText>
          )}
        </Column>
      }
    >
      {driver.name.split(' ').pop() ?? driver.name}
    </ListItem>
  );
}

function TeamListItem({
  team,
  index,
  leaderPoints,
}: {
  team: TeamStanding;
  index: number;
  leaderPoints: number;
}) {
  const isLeader = index === 0;
  return (
    <ListItem
      leading={
        <Row alignment="center" spacing={12}>
          <Column
            alignment="center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              backgroundColor: isLeader
                ? (colors.systemYellow as string)
                : (colors.zinc900 as string),
            }}
          >
            <UIText
              textStyle={{
                fontSize: 13,
                fontWeight: '900',
                color: isLeader ? '#000' : (colors.gray500 as string),
              }}
            >
              {String(index + 1)}
            </UIText>
          </Column>
          <RNHostView>
            <View
              style={{
                width: 60,
                height: 40,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: 6,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
              }}
            >
              <Image
                source={{ uri: getCarImage(team.team, 2025) }}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
              />
            </View>
          </RNHostView>
        </Row>
      }
      trailing={
        <Column alignment="end">
          <UIText
            textStyle={{
              fontSize: 18,
              fontWeight: '900',
              color: isLeader ? (colors.systemYellow as string) : '#fff',
            }}
          >
            {String(team.points)}
          </UIText>
          {index > 0 && (
            <UIText textStyle={{ fontSize: 9, color: colors.gray600 as string }}>
              {`-${leaderPoints - team.points}`}
            </UIText>
          )}
        </Column>
      }
    >
      {team.team}
    </ListItem>
  );
}

export default function StandingsScreen() {
  const [activeTab, setActiveTab] = useState<'drivers' | 'teams'>('drivers');
  const [selectedYear] = useState(new Date().getFullYear());

  const { data: drivers, isLoading: loadingDrivers } = useDriverStandings(selectedYear);
  const { data: teams, isLoading: loadingTeams } = useTeamStandings(selectedYear);

  const isLoading = loadingDrivers || loadingTeams;
  const driverLeaderPoints = drivers?.[0]?.points ?? 0;
  const teamLeaderPoints = teams?.[0]?.points ?? 0;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#000' }}
    >
      {/* Season title */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '900',
            textTransform: 'uppercase',
            fontStyle: 'italic',
          }}
        >
          {selectedYear} Season
        </Text>
      </View>

      {/* Tab selector */}
      <View style={{ marginHorizontal: 16, marginVertical: 8 }}>
        <SegmentedControl
          values={['Drivers', 'Constructors']}
          selectedIndex={activeTab === 'drivers' ? 0 : 1}
          onChange={(event) =>
            setActiveTab(event.nativeEvent.selectedSegmentIndex === 0 ? 'drivers' : 'teams')
          }
          tintColor={colors.red as string}
          appearance="dark"
          style={{ height: 36 }}
        />
      </View>

      {/* Standings content */}
      <View
        style={{
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.1)',
          borderRadius: 12,
          marginHorizontal: 16,
          marginTop: 4,
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <ActivityIndicator color={colors.red} />
          </View>
        ) : (
          <Host matchContents>
            <List>
              {activeTab === 'drivers'
                ? (drivers ?? []).map((driver, idx) => (
                    <DriverListItem
                      key={driver.code}
                      driver={driver}
                      index={idx}
                      leaderPoints={driverLeaderPoints}
                    />
                  ))
                : (teams ?? []).map((team, idx) => (
                    <TeamListItem
                      key={team.team}
                      team={team}
                      index={idx}
                      leaderPoints={teamLeaderPoints}
                    />
                  ))}
            </List>
          </Host>
        )}
      </View>
    </ScrollView>
  );
}
