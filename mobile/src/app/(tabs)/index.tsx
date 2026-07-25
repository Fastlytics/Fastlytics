import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { useDashboardData } from '../../api/hooks';
import { getCountryCode } from '@fastlytics/shared';
import { getDriverImage, getCarImage } from '../../lib/images';
import type { ScheduleEvent, DriverStanding, TeamStanding } from '@fastlytics/shared';

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
        <Text style={{ fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{tl.d}</Text>
        <Text style={{ fontSize: 8, color: colors.gray500, letterSpacing: 1 }}>DAYS</Text>
      </View>
      <Text style={{ fontSize: 20, color: colors.gray700, marginTop: -4 }}>:</Text>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{String(tl.h).padStart(2, '0')}</Text>
        <Text style={{ fontSize: 8, color: colors.gray500, letterSpacing: 1 }}>HRS</Text>
      </View>
      <Text style={{ fontSize: 20, color: colors.gray700, marginTop: -4 }}>:</Text>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'], color: colors.red }}>{String(tl.m).padStart(2, '0')}</Text>
        <Text style={{ fontSize: 8, color: colors.gray500, letterSpacing: 1 }}>MIN</Text>
      </View>
    </View>
  );
}

function NextSessionCard({ scheduleData, selectedYear }: { scheduleData: ScheduleEvent[]; selectedYear: number }) {
  const nextSession = useMemo(() => {
    const _now = new Date();
    for (const event of scheduleData) {
      const sessions = [
        { n: event.Session1, d: event.Session1Date },
        { n: event.Session2, d: event.Session2Date },
        { n: event.Session3, d: event.Session3Date },
        { n: event.Session4, d: event.Session4Date },
        { n: event.Session5, d: event.Session5Date },
      ].filter(s => s.n && s.d) as { n: string; d: string }[];
      sessions.sort((a, b) => new Date(a.d).getTime() - new Date(b.d).getTime());
      const up = sessions.find(s => new Date(s.d) > _now);
      if (up) {
        return {
          eventName: event.EventName,
          sessionName: up.n,
          date: up.d,
          location: event.Location || event.Country || '',
          country: event.Country || event.Location || '',
          round: event.RoundNumber,
        };
      }
    }
    return null;
  }, [scheduleData]);

  if (!nextSession) {
    return (
      <View style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 24, alignItems: 'center' }}>
        <Text style={{ color: colors.gray500, fontSize: 12 }}>No upcoming sessions</Text>
      </View>
    );
  }

  const slug = `${selectedYear}-${nextSession.eventName.toLowerCase().replace(/\s+/g, '-')}`;
  const cc = getCountryCode(nextSession.country || nextSession.location);

  return (
    <Pressable
      onPress={() => router.push(`/race/${slug}`)}
      style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <View style={{ width: 8, height: 8, backgroundColor: colors.red }} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.red, letterSpacing: 1, textTransform: 'uppercase' }}>
              Next Up
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }} numberOfLines={2}>
            {nextSession.eventName.replace('Grand Prix', 'GP')}
          </Text>
        </View>
        {cc !== 'xx' && (
          <Image source={`https://flagcdn.com/h80/${cc}.png`} style={{ width: 48, height: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
        )}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
                  <Text style={{ fontSize: 10, color: colors.gray500, textTransform: 'uppercase' }}>
            {nextSession.location}
          </Text>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff', backgroundColor: 'rgba(220,38,38,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(220,38,38,0.2)', marginTop: 4 }}>
            {nextSession.sessionName}
          </Text>
        </View>
        <CountdownTimer targetDate={new Date(nextSession.date)} />
      </View>
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

  return (
    <View>
      <View style={{ flexDirection: 'row', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 6, marginBottom: 12 }}>
        <Pressable
          onPress={() => setTab('drivers')}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: 'center',
            borderRadius: 8,
            backgroundColor: tab === 'drivers' ? colors.red : 'transparent',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', color: tab === 'drivers' ? '#fff' : colors.gray500 }}>
            Drivers
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('teams')}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: 'center',
            borderRadius: 8,
            backgroundColor: tab === 'teams' ? colors.red : 'transparent',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', color: tab === 'teams' ? '#fff' : colors.gray500 }}>
            Constructors
          </Text>
        </Pressable>
      </View>

      <View style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.1)',
          backgroundColor: 'rgba(24,24,27,0.3)',
        }}>
          <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase', fontStyle: 'italic' }}>
            {tab === 'drivers' ? 'Drivers' : 'Constructors'}
            <Text style={{ color: colors.gray500 }}> Standings</Text>
          </Text>
          <Pressable onPress={() => router.push('/standings')}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: colors.gray500, letterSpacing: 1, textTransform: 'uppercase' }}>
              View All →
            </Text>
          </Pressable>
        </View>

        {(tab === 'drivers' ? topDrivers : topTeams).map((item, idx) => {
          const isLeader = idx === 0;
          const isDriver = 'code' in item;
          return (
            <View key={isDriver ? (item as DriverStanding).code : (item as TeamStanding).team} style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.05)',
            }}>
              <View style={{
                width: 28,
                height: 28,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderRadius: 6,
                backgroundColor: isLeader ? colors.systemYellow : colors.zinc900,
                borderColor: isLeader ? colors.systemYellow : 'rgba(255,255,255,0.1)',
              }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: isLeader ? '#000' : colors.gray500 }}>
                  {idx + 1}
                </Text>
              </View>

              {isDriver ? (
                <>
                  <View style={{ width: 36, height: 36, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' }}>
                    <Image source={{ uri: getDriverImage((item as DriverStanding).code, 2025) }} style={{ width: '100%', height: '100%' }} contentFit="cover" contentPosition="top" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase', fontStyle: 'italic' }} numberOfLines={1}>
                      {(item as DriverStanding).name.split(' ').pop()}
                    </Text>
                    <Text style={{ fontSize: 9, color: colors.gray500 }} numberOfLines={1}>
                      {(item as DriverStanding).team}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={{ width: 48, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: 2 }}>
                    <Image source={{ uri: getCarImage((item as TeamStanding).team, 2025) }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '900', fontSize: 12, textTransform: 'uppercase', fontStyle: 'italic' }} numberOfLines={1}>
                      {(item as TeamStanding).team}
                    </Text>
                  </View>
                </>
              )}

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 16, fontWeight: '900', fontVariant: ['tabular-nums'], color: isLeader ? colors.systemYellow : '#fff' }}>
                  {item.points}
                </Text>
                <Text style={{ fontSize: 8, color: isLeader ? colors.systemYellow : colors.gray600 }}>
                  {isLeader ? 'LEADER' : `-${(tab === 'drivers' ? topDrivers : topTeams)[0].points - item.points}`}
                </Text>
              </View>
            </View>
          );
        })}

        <Pressable
          onPress={() => router.push('/standings')}
          style={{ paddingVertical: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}
        >
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.gray500, letterSpacing: 1, textTransform: 'uppercase' }}>
            Full Standings →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function RecentRacesCard({ scheduleData, selectedYear }: { scheduleData: ScheduleEvent[]; selectedYear: number }) {
  const recentRaces = useMemo(() => {
    const _now = new Date();
    return scheduleData
      .filter(e => !e.EventFormat?.toLowerCase().includes('test') && e.RoundNumber > 0 && new Date(e.EventDate) <= _now)
      .sort((a, b) => new Date(b.EventDate).getTime() - new Date(a.EventDate).getTime())
      .slice(0, 10);
  }, [scheduleData]);

  if (recentRaces.length === 0) return null;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>
          <Text style={{ color: colors.red }}>Recent </Text>
          <Text style={{ color: colors.gray500 }}>Races</Text>
        </Text>
        <Pressable onPress={() => router.push('/calendar')}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: colors.gray500, letterSpacing: 1, textTransform: 'uppercase' }}>
            Calendar →
          </Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 12, gap: 12 }}>
        {recentRaces.map((race) => {
          const cc = getCountryCode(race.Country || race.Location);
          const slug = `${selectedYear}-${race.EventName.toLowerCase().replace(/\s+/g, '-')}`;
          return (
            <Pressable
              key={race.EventName}
              onPress={() => router.push(`/race/${slug}`)}
              style={{ width: 160, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}
            >
              <View style={{ height: 80, overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
                {cc !== 'xx' && (
                  <Image source={`https://flagcdn.com/h120/${cc}.png`} style={{ width: '100%', height: '100%' }} />
                )}
                <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
                <View style={{ position: 'absolute', top: 6, right: 6 }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', backgroundColor: '#fff', color: '#000', paddingHorizontal: 4, paddingVertical: 2, letterSpacing: 1 }}>
                    R{race.RoundNumber}
                  </Text>
                </View>
              </View>
              <View style={{ padding: 10, backgroundColor: 'rgba(24,24,27,0.3)' }}>
                <Text style={{ fontWeight: '900', fontSize: 12, textTransform: 'uppercase', fontStyle: 'italic', marginBottom: 4 }} numberOfLines={2}>
                  {race.EventName.replace('Grand Prix', 'GP')}
                </Text>
                <Text style={{ fontSize: 9, color: colors.gray500 }}>
                  {race.Location}
                </Text>
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
      {/* Header logo */}
      <View style={{ alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>
          Fast<span style={{ color: colors.red }}>lytics</span>
        </Text>
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
