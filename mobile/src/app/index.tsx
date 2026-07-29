import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function SplashScreen() {
  const [target, setTarget] = useState<'auth' | 'tabs' | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setTarget(session ? 'tabs' : 'auth');
    });
  }, []);

  if (target === 'auth') return <Redirect href="/auth" />;
  if (target === 'tabs') return <Redirect href="/(tabs)" />;

  return (
    <View
      style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}
    >
      <ActivityIndicator size="large" color="#dc2626" />
    </View>
  );
}
