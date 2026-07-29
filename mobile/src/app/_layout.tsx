import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, DarkTheme } from 'expo-router/react-navigation';
import { supabase } from '../lib/supabase';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/(tabs)');
      } else if (event === 'SIGNED_OUT') {
        router.replace('/auth');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={DarkTheme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
