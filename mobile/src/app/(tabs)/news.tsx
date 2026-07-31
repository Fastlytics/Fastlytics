import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Host, Row, Switch, Button } from '@expo/ui';
import {
  useDriverStandings,
  useInfiniteNewsFeed,
  useMyFavorites,
  useTeamStandings,
} from '../../api/hooks';
import { useAuthUser } from '../../lib/useAuthUser';
import { colors } from '../../theme/colors';
import type { NewsArticle } from '../../lib/api';

const CURRENT_SEASON = new Date().getFullYear();

const timeAgo = (publishedAt: string) => {
  const timestamp = new Date(publishedAt).getTime();
  if (Number.isNaN(timestamp)) return '';

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
};

function NewsCard({ article, onOpen }: { article: NewsArticle; onOpen: (url: string) => void }) {
  const tags = [...article.drivers, ...article.teams].slice(0, 3);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Read ${article.rewritten_title}`}
      onPress={() => onOpen(article.source_url)}
      style={({ pressed }) => ({
        overflow: 'hidden',
        borderWidth: 2,
        borderRadius: 12,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(24,24,27,0.3)',
        opacity: pressed ? 0.76 : 1,
      })}
    >
      <View style={{ height: 176, backgroundColor: colors.zinc900 }}>
        {article.image_url ? (
          <Image
            source={{ uri: article.image_url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={180}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.gray600, fontSize: 12, fontWeight: '900' }}>F1</Text>
          </View>
        )}
        <View
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            maxWidth: '75%',
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: 'rgba(0,0,0,0.72)',
          }}
        >
          <Text numberOfLines={1} style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
            {article.source_name}
          </Text>
        </View>
      </View>

      <View style={{ padding: 14 }}>
        <Text
          numberOfLines={2}
          style={{ color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 21 }}
        >
          {article.rewritten_title}
        </Text>
        <Text
          numberOfLines={3}
          style={{ color: colors.gray500, fontSize: 12, lineHeight: 18, marginTop: 7 }}
        >
          {article.summary}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 6,
            marginTop: 14,
          }}
        >
          <Text style={{ color: colors.gray600, fontSize: 11 }}>
            {timeAgo(article.published_at)}
          </Text>
          {tags.map((tag) => (
            <View
              key={tag}
              style={{
                borderWidth: 1,
                borderColor: 'rgba(96,165,250,0.32)',
                borderRadius: 5,
                paddingHorizontal: 6,
                paddingVertical: 3,
                backgroundColor: 'rgba(96,165,250,0.08)',
              }}
            >
              <Text style={{ color: '#93c5fd', fontSize: 10, fontWeight: '700' }}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

function FeedSkeleton() {
  return (
    <View style={{ gap: 16, marginTop: 20 }}>
      {Array.from({ length: 3 }, (_, index) => (
        <View
          key={index}
          style={{
            overflow: 'hidden',
            borderWidth: 2,
            borderRadius: 12,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <View style={{ height: 176, backgroundColor: 'rgba(255,255,255,0.04)' }} />
          <View style={{ padding: 14, gap: 8 }}>
            <View
              style={{
                height: 16,
                width: '88%',
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            />
            <View
              style={{
                height: 12,
                width: '100%',
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.04)',
              }}
            />
            <View
              style={{
                height: 12,
                width: '64%',
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.04)',
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function NewsScreen() {
  const { user } = useAuthUser();
  const [showPersonalized, setShowPersonalized] = useState(true);

  const { data: favorites } = useMyFavorites(user?.id);
  const { data: drivers } = useDriverStandings(CURRENT_SEASON);
  const { data: teams } = useTeamStandings(CURRENT_SEASON);

  // Resolve favorite_driver (code) -> last name, favorite_team -> name without " Racing",
  // matching the web app's article-tag format.
  const favoriteDriverCode = favorites?.favorite_driver;
  const favoriteTeamValue = favorites?.favorite_team;

  const favoriteDriverName = (() => {
    if (!favoriteDriverCode || !drivers?.length) return undefined;
    const driver = drivers.find(
      (item) =>
        item.code === favoriteDriverCode ||
        item.name.toLowerCase().includes(favoriteDriverCode.toLowerCase())
    );
    return driver?.name.split(' ').pop();
  })();

  const favoriteTeamName = (() => {
    if (!favoriteTeamValue || !teams?.length) return undefined;
    const team = teams.find((item) => item.team === favoriteTeamValue);
    return (team?.team ?? favoriteTeamValue).replace(' Racing', '');
  })();

  const hasFavorites = Boolean(favoriteDriverName || favoriteTeamName);
  const personalizing = showPersonalized && hasFavorites;

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useInfiniteNewsFeed(
    personalizing ? { driver: favoriteDriverName, team: favoriteTeamName } : undefined
  );
  const articles = data?.pages.flat() ?? [];

  const openArticle = useCallback(async (url: string) => {
    if (!/^https?:\/\//i.test(url)) return;
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    }
  }, []);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={colors.red}
        />
      }
      style={{ flex: 1, backgroundColor: '#000' }}
      contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 40 }}
    >
      <View style={{ paddingTop: 8 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '900',
            textTransform: 'uppercase',
            fontStyle: 'italic',
          }}
        >
          F1 <Text style={{ color: colors.red }}>News</Text>
        </Text>
        <Text style={{ color: colors.gray500, fontSize: 12, marginTop: 4 }}>
          {personalizing
            ? `Personalized for ${[favoriteDriverName, favoriteTeamName].filter(Boolean).join(' & ')}`
            : "Latest stories from Fastlytics' trusted Formula 1 sources."}
        </Text>
      </View>

      {hasFavorites && (
        <View
          style={{
            marginTop: 16,
            padding: 12,
            borderWidth: 2,
            borderRadius: 12,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <Host matchContents>
            <Row alignment="center">
              <Switch
                value={showPersonalized}
                onValueChange={setShowPersonalized}
                label="For you"
              />
            </Row>
          </Host>
        </View>
      )}

      {isLoading ? (
        <FeedSkeleton />
      ) : isError ? (
        <View
          style={{
            minHeight: 300,
            marginTop: 20,
            padding: 24,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderRadius: 12,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '900',
              textTransform: 'uppercase',
              fontStyle: 'italic',
            }}
          >
            News unavailable
          </Text>
          <Text
            style={{
              color: colors.gray500,
              fontSize: 12,
              lineHeight: 18,
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            {error instanceof Error ? error.message : 'Please check your connection and try again.'}
          </Text>
          <Host matchContents style={{ marginTop: 16 }}>
            <Button variant="outlined" label="Try again" onPress={() => void refetch()} />
          </Host>
        </View>
      ) : articles.length === 0 ? (
        <View
          style={{
            minHeight: 300,
            marginTop: 20,
            padding: 24,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderRadius: 12,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '900',
              textTransform: 'uppercase',
              fontStyle: 'italic',
            }}
          >
            No articles yet
          </Text>
          <Text
            style={{
              color: colors.gray500,
              fontSize: 12,
              lineHeight: 18,
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            New stories will appear here after the next feed update.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 16, marginTop: 20 }}>
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} onOpen={openArticle} />
          ))}
          {hasNextPage &&
            (isFetchingNextPage ? (
              <View style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.red} />
              </View>
            ) : (
              <Host matchContents>
                <Button variant="outlined" label="Load more" onPress={() => void fetchNextPage()} />
              </Host>
            ))}
        </View>
      )}
    </ScrollView>
  );
}
