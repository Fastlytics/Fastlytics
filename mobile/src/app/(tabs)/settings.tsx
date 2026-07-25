import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { supabase } from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function SettingsScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.data.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#000' }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
    >
      {/* Logo */}
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>
          Fast<span style={{ color: colors.red }}>lytics</span>
        </Text>
        <Text style={{ fontSize: 10, color: colors.gray600, marginTop: 2 }}>Formula 1 Analytics</Text>
      </View>

      {/* Account Section */}
      {loading ? (
        <View style={{ alignItems: 'center', padding: 20 }}><ActivityIndicator color={colors.red} /></View>
      ) : user ? (
        <View style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 48, height: 48, borderRadius: 24, overflow: 'hidden',
              backgroundColor: colors.zinc800, alignItems: 'center', justifyContent: 'center',
            }}>
              {user.user_metadata?.avatar_url ? (
                <Image source={{ uri: user.user_metadata.avatar_url }} style={{ width: '100%', height: '100%' }} />
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
              marginTop: 12, paddingVertical: 10, borderRadius: 8, alignItems: 'center',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.red }}>Sign Out</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => router.push('/auth')}
          style={{
            borderWidth: 2, borderColor: colors.red, borderRadius: 12, padding: 20, alignItems: 'center',
            backgroundColor: 'rgba(220,38,38,0.05)',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '900', color: colors.red, textTransform: 'uppercase' }}>Sign In</Text>
          <Text style={{ fontSize: 11, color: colors.gray500, marginTop: 4 }}>Unlock all features</Text>
        </Pressable>
      )}

      {/* Quick Links */}
      <View style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
        {[
          { label: 'Championship Progression', route: '/progression' },
          { label: 'Drivers', route: '/drivers' },
          { label: 'Teams', route: '/teams' },
        ].map((item, idx) => (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route as any)}
            style={{
              paddingVertical: 14, paddingHorizontal: 16,
              borderBottomWidth: idx < 2 ? 1 : 0,
              borderBottomColor: 'rgba(255,255,255,0.05)',
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600' }}>{item.label}</Text>
            <Text style={{ color: colors.gray600, fontSize: 14 }}>›</Text>
          </Pressable>
        ))}
      </View>

      {/* Legal */}
      <View style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
        {[
          { label: 'Privacy Policy', route: '/privacy' },
          { label: 'Terms of Service', route: '/terms' },
          { label: 'Refund Policy', route: '/refund' },
          { label: 'Contact', route: '/contact' },
          { label: 'FAQ', route: '/faq' },
          { label: 'About', route: '/about' },
        ].map((item, idx) => (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route as any)}
            style={{
              paddingVertical: 14, paddingHorizontal: 16,
              borderBottomWidth: idx < 5 ? 1 : 0,
              borderBottomColor: 'rgba(255,255,255,0.05)',
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, color: colors.gray500 }}>{item.label}</Text>
            <Text style={{ color: colors.gray600, fontSize: 14 }}>›</Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ fontSize: 10, color: colors.gray600, textAlign: 'center', marginTop: 8 }}>
        Fastlytics Mobile v1.0.0
      </Text>
    </ScrollView>
  );
}
