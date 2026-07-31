import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { Host, FieldGroup, ListItem, RNHostView, Icon } from '@expo/ui';
import { colors } from '../../theme/colors';
import BrandWordmark from '../../components/BrandWordmark';
import FavoritePicker, { type FavoritePickerOption } from '../../components/FavoritePicker';
import { supabase } from '../../lib/supabase';
import { useAuthUser } from '../../lib/useAuthUser';
import { getCarImage, getDriverImage } from '../../lib/images';
import {
  useDriverStandings,
  useMyFavorites,
  useTeamStandings,
  useUpdateFavorites,
} from '../../api/hooks';

const CHEVRON_RIGHT = Icon.select({
  ios: 'chevron.right',
  android: import('@expo/material-symbols/chevron_right.xml'),
});

const quickLinks: { label: string; route: Href }[] = [
  { label: 'Standings', route: '/standings' },
  { label: 'Championship Progression', route: '/progression' },
  { label: 'Drivers', route: '/drivers' },
  { label: 'Teams', route: '/teams' },
];

const legalLinks: { label: string; route: Href }[] = [
  { label: 'Privacy Policy', route: '/privacy' },
  { label: 'Terms of Service', route: '/terms' },
  { label: 'Refund Policy', route: '/refund' },
  { label: 'Contact', route: '/contact' },
  { label: 'FAQ', route: '/faq' },
  { label: 'About', route: '/about' },
];

const CURRENT_SEASON = new Date().getFullYear();

function LinkRow({ label, route }: { label: string; route: Href }) {
  return (
    <ListItem
      onPress={() => router.push(route)}
      trailing={<Icon name={CHEVRON_RIGHT} size={13} color={colors.gray600} />}
    >
      {label}
    </ListItem>
  );
}

function FavoritesSection({ userId }: { userId: string }) {
  const [pickerOpen, setPickerOpen] = useState<'driver' | 'team' | null>(null);
  const { data: drivers, isLoading: loadingDrivers } = useDriverStandings(CURRENT_SEASON);
  const { data: teams, isLoading: loadingTeams } = useTeamStandings(CURRENT_SEASON);
  const { data: favorites, isLoading: loadingFavorites } = useMyFavorites(userId);
  const { mutate: updateFavorites } = useUpdateFavorites(userId);

  const driverOptions = useMemo<FavoritePickerOption[]>(
    () =>
      (drivers ?? []).map((driver) => ({
        key: driver.code,
        label: driver.name,
        imageUri: getDriverImage(driver.code, CURRENT_SEASON),
      })),
    [drivers]
  );

  const teamOptions = useMemo<FavoritePickerOption[]>(
    () =>
      (teams ?? []).map((team) => ({
        key: team.team,
        label: team.team,
        imageUri: getCarImage(team.team, CURRENT_SEASON),
      })),
    [teams]
  );

  const selectedDriver = drivers?.find((driver) => driver.code === favorites?.favorite_driver);
  const selectedTeam = teams?.find((team) => team.team === favorites?.favorite_team);
  const loadingOptions = loadingDrivers || loadingTeams || loadingFavorites;

  return (
    <>
      <FieldGroup.Section title="Favorites">
        <ListItem
          onPress={() => setPickerOpen('driver')}
          leading={
            selectedDriver ? (
              <RNHostView>
                <View style={{ width: 22, height: 22, borderRadius: 11, overflow: 'hidden' }}>
                  <Image
                    source={{ uri: getDriverImage(selectedDriver.code, CURRENT_SEASON) }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    contentPosition="top"
                  />
                </View>
              </RNHostView>
            ) : undefined
          }
          supportingText={loadingOptions ? 'Loading…' : (selectedDriver?.name ?? 'None')}
          trailing={<Icon name={CHEVRON_RIGHT} size={13} color={colors.gray600} />}
        >
          Favorite Driver
        </ListItem>
        <ListItem
          onPress={() => setPickerOpen('team')}
          leading={
            selectedTeam ? (
              <RNHostView>
                <View style={{ width: 32, height: 22 }}>
                  <Image
                    source={{ uri: getCarImage(selectedTeam.team, CURRENT_SEASON) }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="contain"
                  />
                </View>
              </RNHostView>
            ) : undefined
          }
          supportingText={loadingOptions ? 'Loading…' : (selectedTeam?.team ?? 'None')}
          trailing={<Icon name={CHEVRON_RIGHT} size={13} color={colors.gray600} />}
        >
          Favorite Team
        </ListItem>
      </FieldGroup.Section>

      <FavoritePicker
        visible={pickerOpen === 'driver'}
        title="Favorite Driver"
        options={driverOptions}
        selectedKey={favorites?.favorite_driver ?? null}
        onClose={() => setPickerOpen(null)}
        onSelect={(key) => updateFavorites({ favorite_driver: key })}
      />
      <FavoritePicker
        visible={pickerOpen === 'team'}
        title="Favorite Team"
        options={teamOptions}
        selectedKey={favorites?.favorite_team ?? null}
        onClose={() => setPickerOpen(null)}
        onSelect={(key) => updateFavorites({ favorite_team: key })}
      />
    </>
  );
}

export default function AccountScreen() {
  const { user, loading } = useAuthUser();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#000' }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
    >
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <BrandWordmark showTagline />
      </View>

      {loading ? (
        <View style={{ alignItems: 'center', padding: 20 }}>
          <ActivityIndicator color={colors.red} />
        </View>
      ) : user ? (
        <View
          style={{
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                overflow: 'hidden',
                backgroundColor: colors.zinc800,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {user.user_metadata?.avatar_url ? (
                <Image
                  source={{ uri: user.user_metadata.avatar_url }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.gray500 }}>
                  {(user.email?.[0] || '?').toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', fontSize: 16 }}>
                {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
              </Text>
              <Text style={{ fontSize: 12, color: colors.gray500 }}>{user.email}</Text>
            </View>
          </View>
          <Pressable
            onPress={handleSignOut}
            style={{
              marginTop: 12,
              paddingVertical: 10,
              borderRadius: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.red }}>Sign Out</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => router.push('/auth')}
          style={{
            borderWidth: 2,
            borderColor: colors.red,
            borderRadius: 12,
            padding: 20,
            alignItems: 'center',
            backgroundColor: 'rgba(220,38,38,0.05)',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '900',
              color: colors.red,
              textTransform: 'uppercase',
            }}
          >
            Sign In
          </Text>
          <Text style={{ fontSize: 11, color: colors.gray500, marginTop: 4 }}>
            Unlock all features
          </Text>
        </Pressable>
      )}

      <Host matchContents>
        <FieldGroup>
          {user ? <FavoritesSection userId={user.id} /> : null}

          <FieldGroup.Section title="Explore">
            {quickLinks.map((link) => (
              <LinkRow key={link.label} label={link.label} route={link.route} />
            ))}
          </FieldGroup.Section>

          <FieldGroup.Section title="Legal">
            {legalLinks.map((link) => (
              <LinkRow key={link.label} label={link.label} route={link.route} />
            ))}
          </FieldGroup.Section>
        </FieldGroup>
      </Host>

      <Text style={{ fontSize: 10, color: colors.gray600, textAlign: 'center', marginTop: 8 }}>
        Fastlytics Mobile v1.0.0
      </Text>
    </ScrollView>
  );
}
