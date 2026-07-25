import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const [tab, setTab] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (!email || !password) { setError('Fill in all fields'); return; }
    if (tab === 'signup' && password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      if (tab === 'signup') {
        const { data, error: e } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: undefined },
        });
        if (e) { setError(e.message); return; }
        if (data?.user?.identities?.length === 0) {
          setError('An account with this email already exists');
          return;
        }
        setSuccess('Check your email for the confirmation link!');
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) { setError(e.message); return; }
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: 'google' | 'github' | 'discord') => {
    setLoading(true);
    try {
      const { error: e } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: undefined },
      });
      if (e) setError(e.message);
    } catch (err: any) {
      setError(err?.message || 'OAuth failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 100, paddingBottom: 60 }}>
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff' }}>F</Text>
        </View>
        <Text style={{ fontSize: 28, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>Fastlytics</Text>
        <Text style={{ fontSize: 12, color: colors.gray500, marginTop: 4 }}>Formula 1 Analytics</Text>
      </View>

      {/* Tab Toggle */}
      <View style={{ flexDirection: 'row', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        {(['signup', 'signin'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => { setTab(t); setError(''); setSuccess(''); }}
            style={{
              flex: 1, paddingVertical: 12, alignItems: 'center',
              backgroundColor: tab === t ? colors.red : 'transparent',
            }}
          >
            <Text style={{ fontWeight: '900', fontSize: 13, textTransform: 'uppercase', color: tab === t ? '#fff' : colors.gray500 }}>
              {t === 'signup' ? 'Sign Up' : 'Sign In'}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? (
        <View style={{ padding: 12, backgroundColor: 'rgba(220,38,38,0.15)', borderWidth: 1, borderColor: colors.red, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ color: colors.red, fontSize: 12 }}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={{ padding: 12, backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: '#22c55e', borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ color: '#22c55e', fontSize: 12 }}>{success}</Text>
        </View>
      ) : null}

      {/* Form */}
      <View style={{ gap: 12, marginBottom: 20 }}>
        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.gray600}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
            padding: 14, fontSize: 14, color: '#fff', fontWeight: '600',
          }}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.gray600}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
            padding: 14, fontSize: 14, color: '#fff', fontWeight: '600',
          }}
        />
        {tab === 'signup' && (
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor={colors.gray600}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            style={{
              borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
              padding: 14, fontSize: 14, color: '#fff', fontWeight: '600',
            }}
          />
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={{
            paddingVertical: 14, borderRadius: 10, alignItems: 'center',
            backgroundColor: colors.red, opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ fontWeight: '900', fontSize: 14, textTransform: 'uppercase', color: '#fff' }}>
              {tab === 'signup' ? 'Create Account' : 'Sign In'}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
        <Text style={{ marginHorizontal: 12, fontSize: 11, color: colors.gray500, fontWeight: '700' }}>OR CONTINUE WITH</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
      </View>

      {/* Social */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(['google', 'github', 'discord'] as const).map(p => (
          <Pressable
            key={p}
            onPress={() => handleSocial(p)}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
              borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.secondaryLabel, textTransform: 'capitalize' }}>{p}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => router.back()} style={{ padding: 16, alignItems: 'center', marginTop: 20 }}>
        <Text style={{ color: colors.gray500, fontSize: 12 }}>Back to app</Text>
      </Pressable>
    </ScrollView>
  );
}
