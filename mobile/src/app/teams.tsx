import { View, Text, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  Host,
  Column,
  Row,
  Text as UIText,
  List,
  ListItem,
  RNHostView,
  Icon,
  Button,
} from '@expo/ui';
import { colors } from '../theme/colors';
import { useTeamStandings } from '../api/hooks';
import { getCarImage } from '../lib/images';
import { getTeamSlug } from '@fastlytics/shared';

const CHEVRON_LEFT = Icon.select({
  ios: 'chevron.left',
  android: import('@expo/material-symbols/chevron_left.xml'),
});

export default function TeamsScreen() {
  const season = new Date().getFullYear();
  const { data: standings, isLoading, isError } = useTeamStandings(season);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingTop: 60, paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Host matchContents>
            <Button variant="text" onPress={() => router.back()}>
              <Row alignment="center" spacing={2}>
                <Icon name={CHEVRON_LEFT} size={14} color={colors.red} />
                <UIText
                  textStyle={{ fontSize: 14, fontWeight: '700', color: colors.red as string }}
                >
                  Back
                </UIText>
              </Row>
            </Button>
          </Host>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '900',
              textTransform: 'uppercase',
              fontStyle: 'italic',
            }}
          >
            Teams
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 40 }}>
        {isLoading ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <ActivityIndicator color={colors.red} />
          </View>
        ) : isError ? (
          <Text style={{ color: colors.gray500, textAlign: 'center', padding: 40 }}>
            Constructor standings could not be loaded.
          </Text>
        ) : (standings?.length ?? 0) > 0 ? (
          <View
            style={{
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <Host matchContents>
              <List>
                {standings?.map((team) => {
                  const carImage = getCarImage(team.team, season);
                  return (
                    <ListItem
                      key={team.team}
                      onPress={() => router.push(`/team/${getTeamSlug(team.team)}`)}
                      leading={
                        <Row alignment="center" spacing={12}>
                          <Column
                            alignment="center"
                            style={{
                              width: 32,
                              height: 22,
                              borderRadius: 4,
                              backgroundColor:
                                team.rank <= 3 ? (colors.systemYellow as string) : 'transparent',
                            }}
                          >
                            <UIText
                              textStyle={{
                                fontSize: 11,
                                fontWeight: '900',
                                color: team.rank <= 3 ? '#000' : (colors.gray500 as string),
                              }}
                            >
                              {String(team.rank)}
                            </UIText>
                          </Column>
                          {carImage ? (
                            <RNHostView>
                              <View
                                style={{
                                  width: 48,
                                  height: 32,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Image
                                  source={{ uri: carImage }}
                                  style={{ width: '100%', height: '100%' }}
                                  contentFit="contain"
                                />
                              </View>
                            </RNHostView>
                          ) : (
                            <Column alignment="center" style={{ width: 48, height: 32 }}>
                              <UIText
                                textStyle={{ color: colors.gray500 as string, fontWeight: '900' }}
                              >
                                {team.team.charAt(0)}
                              </UIText>
                            </Column>
                          )}
                        </Row>
                      }
                      trailing={
                        <UIText
                          textStyle={{
                            fontSize: 16,
                            fontWeight: '900',
                            color: colors.systemYellow as string,
                          }}
                        >
                          {String(team.points)}
                        </UIText>
                      }
                    >
                      {team.team}
                    </ListItem>
                  );
                })}
              </List>
            </Host>
          </View>
        ) : (
          <Text style={{ color: colors.gray500, textAlign: 'center', padding: 40 }}>
            Team data is not available for this season.
          </Text>
        )}
      </View>
    </View>
  );
}
