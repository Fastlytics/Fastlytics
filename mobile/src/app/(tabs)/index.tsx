import { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  Host,
  Column,
  Row,
  Text as UIText,
  Button,
  Icon,
  List,
  ListItem,
  RNHostView,
} from '@expo/ui';
import SegmentedControl from '@expo/ui/community/segmented-control';
import { colors } from '../../theme/colors';
import BrandWordmark from '../../components/BrandWordmark';
import AdaptiveGlass from '../../components/AdaptiveGlass';
import { useDashboardData } from '../../api/hooks';
import { getCountryCode } from '@fastlytics/shared';
import { getDriverImage, getCarImage } from '../../lib/images';
import type { ScheduleEvent, DriverStanding, TeamStanding } from '@fastlytics/shared';

const CHEVRON_RIGHT = Icon.select({
  ios: 'chevron.right',
  android: import('@expo/material-symbols/chevron_right.xml'),
});

function ChevronLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Host matchContents>
      <Button variant="text" onPress={onPress}>
        <Row alignment="center" spacing={2}>
          <UIText
            textStyle={{
              fontSize: 9,
              fontWeight: '700',
              color: colors.gray500 as string,
              letterSpacing: 1,
            }}
          >
            {label.toUpperCase()}
          </UIText>
          <Icon name={CHEVRON_RIGHT} size={11} color={colors.gray500} />
        </Row>
      </Button>
    </Host>
  );
}

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const calc = useCallback(() => {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff / 3600000) % 24),
      m: Math.floor((diff / 60000) % 60),
      s: Math.floor((diff / 1000) % 60),
    };
  }, [targetDate]);

  const [tl, setTl] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTl(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);

  if (!tl) return null;

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
          {tl.d}
        </Text>
        <Text style={{ fontSize: 8, color: colors.gray500, letterSpacing: 1 }}>DAYS</Text>
      </View>
      <Text style={{ fontSize: 20, color: colors.gray700, marginTop: -4 }}>:</Text>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
          {String(tl.h).padStart(2, '0')}
        </Text>
        <Text style={{ fontSize: 8, color: colors.gray500, letterSpacing: 1 }}>HRS</Text>
      </View>
      <Text style={{ fontSize: 20, color: colors.gray700, marginTop: -4 }}>:</Text>
      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '900',
            fontVariant: ['tabular-nums'],
            color: colors.red,
          }}
        >
          {String(tl.m).padStart(2, '0')}
        </Text>
        <Text style={{ fontSize: 8, color: colors.gray500, letterSpacing: 1 }}>MIN</Text>
      </View>
    </View>
  );
}

function NextSessionCard({
  scheduleData,
  selectedYear,
}: {
  scheduleData: ScheduleEvent[];
  selectedYear: number;
}) {
  const now = new Date();
  const nextSession = scheduleData.reduce<{
    eventName: string;
    sessionName: string;
    date: string;
    location: string;
    country: string;
    round: number;
  } | null>((next, event) => {
    if (next) return next;

    const upcomingSession = [
      { n: event.Session1, d: event.Session1Date },
      { n: event.Session2, d: event.Session2Date },
      { n: event.Session3, d: event.Session3Date },
      { n: event.Session4, d: event.Session4Date },
      { n: event.Session5, d: event.Session5Date },
    ]
      .filter((session): session is { n: string; d: string } => Boolean(session.n && session.d))
      .sort((left, right) => new Date(left.d).getTime() - new Date(right.d).getTime())
      .find((session) => new Date(session.d) > now);

    return upcomingSession
      ? {
          eventName: event.EventName,
          sessionName: upcomingSession.n,
          date: upcomingSession.d,
          location: event.Location || event.Country || '',
          country: event.Country || event.Location || '',
          round: event.RoundNumber,
        }
      : null;
  }, null);

  if (!nextSession) {
    return (
      <View
        style={{
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 24,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: colors.gray500, fontSize: 12 }}>No upcoming sessions</Text>
      </View>
    );
  }

  const slug = `${selectedYear}-${nextSession.eventName.toLowerCase().replace(/\s+/g, '-')}`;
  const cc = getCountryCode(nextSession.country || nextSession.location);

  return (
    <Pressable onPress={() => router.push(`/race/${slug}`)}>
      <AdaptiveGlass
        style={{
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 16,
          overflow: 'hidden',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <View style={{ width: 8, height: 8, backgroundColor: colors.red }} />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: colors.red,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                Next Up
              </Text>
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '900',
                textTransform: 'uppercase',
                fontStyle: 'italic',
              }}
              numberOfLines={2}
            >
              {nextSession.eventName.replace('Grand Prix', 'GP')}
            </Text>
          </View>
          {cc !== 'xx' && (
            <Image
              source={`https://flagcdn.com/h80/${cc}.png`}
              style={{
                width: 48,
                height: 32,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
              }}
            />
          )}
        </View>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}
        >
          <View>
            <Text style={{ fontSize: 10, color: colors.gray500, textTransform: 'uppercase' }}>
              {nextSession.location}
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#fff',
                backgroundColor: 'rgba(220,38,38,0.1)',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderWidth: 1,
                borderColor: 'rgba(220,38,38,0.2)',
                marginTop: 4,
              }}
            >
              {nextSession.sessionName}
            </Text>
          </View>
          <CountdownTimer targetDate={new Date(nextSession.date)} />
        </View>
      </AdaptiveGlass>
    </Pressable>
  );
}

function ChampionshipWidget({
  drivers,
  teams,
  isLoading,
}: {
  drivers: DriverStanding[];
  teams: TeamStanding[];
  isLoading: boolean;
}) {
  const [tab, setTab] = useState<'drivers' | 'teams'>('drivers');
  const topDrivers = drivers.slice(0, 5);
  const topTeams = teams.slice(0, 5);

  if (isLoading) {
    return (
      <View style={{ padding: 24, alignItems: 'center' }}>
        <ActivityIndicator color={colors.red} />
      </View>
    );
  }

  const leaderPoints = (tab === 'drivers' ? topDrivers : topTeams)[0]?.points ?? 0;

  return (
    <View>
      <View style={{ marginBottom: 12 }}>
        <SegmentedControl
          values={['Drivers', 'Constructors']}
          selectedIndex={tab === 'drivers' ? 0 : 1}
          onValueChange={(value) => setTab(value === 'Drivers' ? 'drivers' : 'teams')}
          tintColor={colors.red as string}
          appearance="dark"
          style={{ height: 36 }}
        />
      </View>

      <View
        style={{
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.1)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(24,24,27,0.3)',
          }}
        >
          <Text
            style={{
              fontWeight: '900',
              fontSize: 16,
              textTransform: 'uppercase',
              fontStyle: 'italic',
            }}
          >
            {tab === 'drivers' ? 'Drivers' : 'Constructors'}
            <Text style={{ color: colors.gray500 }}> Standings</Text>
          </Text>
          <ChevronLink label="View All" onPress={() => router.push('/standings')} />
        </View>

        <Host matchContents>
          <List>
            {(tab === 'drivers' ? topDrivers : topTeams).map((item, idx) => {
              const isLeader = idx === 0;
              const isDriver = 'code' in item;
              const rankBadge = (
                <Column
                  alignment="center"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    borderWidth: 2,
                    backgroundColor: isLeader
                      ? (colors.systemYellow as string)
                      : (colors.zinc900 as string),
                    borderColor: isLeader
                      ? (colors.systemYellow as string)
                      : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <UIText
                    textStyle={{
                      fontSize: 11,
                      fontWeight: '900',
                      color: isLeader ? '#000' : (colors.gray500 as string),
                    }}
                  >
                    {String(idx + 1)}
                  </UIText>
                </Column>
              );
              const photo = isDriver ? (
                <RNHostView>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      source={{ uri: getDriverImage((item as DriverStanding).code, 2025) }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      contentPosition="top"
                    />
                  </View>
                </RNHostView>
              ) : (
                <RNHostView>
                  <View
                    style={{
                      width: 48,
                      height: 32,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      padding: 2,
                    }}
                  >
                    <Image
                      source={{ uri: getCarImage((item as TeamStanding).team, 2025) }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="contain"
                    />
                  </View>
                </RNHostView>
              );

              return (
                <ListItem
                  key={isDriver ? (item as DriverStanding).code : (item as TeamStanding).team}
                  leading={
                    <Row alignment="center" spacing={10}>
                      {rankBadge}
                      {photo}
                    </Row>
                  }
                  supportingText={isDriver ? (item as DriverStanding).team : undefined}
                  trailing={
                    <Column alignment="end">
                      <UIText
                        textStyle={{
                          fontSize: 16,
                          fontWeight: '900',
                          color: isLeader ? (colors.systemYellow as string) : '#fff',
                        }}
                      >
                        {String(item.points)}
                      </UIText>
                      <UIText
                        textStyle={{
                          fontSize: 8,
                          color: isLeader
                            ? (colors.systemYellow as string)
                            : (colors.gray600 as string),
                        }}
                      >
                        {isLeader ? 'LEADER' : `-${leaderPoints - item.points}`}
                      </UIText>
                    </Column>
                  }
                >
                  {isDriver
                    ? ((item as DriverStanding).name.split(' ').pop() ?? '')
                    : (item as TeamStanding).team}
                </ListItem>
              );
            })}
          </List>
        </Host>

        <Pressable
          onPress={() => router.push('/standings')}
          style={{
            paddingVertical: 14,
            alignItems: 'center',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.gray500,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Full Standings →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function RecentRacesCard({
  scheduleData,
  selectedYear,
}: {
  scheduleData: ScheduleEvent[];
  selectedYear: number;
}) {
  const recentRaces = useMemo(() => {
    const _now = new Date();
    return scheduleData
      .filter(
        (e) =>
          !e.EventFormat?.toLowerCase().includes('test') &&
          e.RoundNumber > 0 &&
          new Date(e.EventDate) <= _now
      )
      .sort((a, b) => new Date(b.EventDate).getTime() - new Date(a.EventDate).getTime())
      .slice(0, 10);
  }, [scheduleData]);

  if (recentRaces.length === 0) return null;

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 2,
          borderBottomColor: 'rgba(255,255,255,0.1)',
          paddingBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '900',
            textTransform: 'uppercase',
            fontStyle: 'italic',
          }}
        >
          <Text style={{ color: colors.red }}>Recent </Text>
          <Text style={{ color: colors.gray500 }}>Races</Text>
        </Text>
        <ChevronLink label="Calendar" onPress={() => router.push('/calendar')} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 12, gap: 12 }}
      >
        {recentRaces.map((race) => {
          const cc = getCountryCode(race.Country || race.Location);
          const slug = `${selectedYear}-${race.EventName.toLowerCase().replace(/\s+/g, '-')}`;
          return (
            <Pressable
              key={race.EventName}
              onPress={() => router.push(`/race/${slug}`)}
              style={{
                width: 160,
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: 80,
                  overflow: 'hidden',
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(255,255,255,0.1)',
                }}
              >
                {cc !== 'xx' && (
                  <Image
                    source={`https://flagcdn.com/h120/${cc}.png`}
                    style={{ width: '100%', height: '100%' }}
                  />
                )}
                <View
                  style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
                />
                <View style={{ position: 'absolute', top: 6, right: 6 }}>
                  <Text
                    style={{
                      fontSize: 8,
                      fontWeight: '900',
                      backgroundColor: '#fff',
                      color: '#000',
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                      letterSpacing: 1,
                    }}
                  >
                    R{race.RoundNumber}
                  </Text>
                </View>
              </View>
              <View style={{ padding: 10, backgroundColor: 'rgba(24,24,27,0.3)' }}>
                <Text
                  style={{
                    fontWeight: '900',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    fontStyle: 'italic',
                    marginBottom: 4,
                  }}
                  numberOfLines={2}
                >
                  {race.EventName.replace('Grand Prix', 'GP')}
                </Text>
                <Text style={{ fontSize: 9, color: colors.gray500 }}>{race.Location}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function DashboardScreen() {
  const [selectedYear] = useState(new Date().getFullYear());
  const { schedule, drivers, teams, isLoading } = useDashboardData(selectedYear);
  const scheduleData = schedule.data ?? [];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#000' }}
      contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 40 }}
    >
      <View style={{ alignItems: 'center', marginBottom: 4 }}>
        <BrandWordmark showTagline />
      </View>

      {isLoading && schedule.isLoading ? (
        <View style={{ padding: 32, alignItems: 'center' }}>
          <ActivityIndicator color={colors.red} size="large" />
        </View>
      ) : (
        <>
          {/* Next Session */}
          {scheduleData.length > 0 && (
            <NextSessionCard scheduleData={scheduleData} selectedYear={selectedYear} />
          )}

          {/* Championship Widget */}
          <ChampionshipWidget
            drivers={drivers.data ?? []}
            teams={teams.data ?? []}
            isLoading={drivers.isLoading || teams.isLoading}
          />

          {/* Recent Races */}
          {scheduleData.length > 0 && (
            <RecentRacesCard scheduleData={scheduleData} selectedYear={selectedYear} />
          )}
        </>
      )}
    </ScrollView>
  );
}
