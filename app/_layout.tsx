import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { Caveat_500Medium, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { PlayfairDisplay_500Medium, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Fraunces_500Medium, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Comfortaa_500Medium, Comfortaa_700Bold } from '@expo-google-fonts/comfortaa';
import { LibreBaskerville_400Regular, LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';
import { Quicksand_500Medium, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { Cinzel_600SemiBold, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Bungee_400Regular } from '@expo-google-fonts/bungee';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LockOverlay } from '@/src/components/LockScreen';
import { useHydrated } from '@/src/store/useDiary';
import { BookThemeProvider } from '@/src/theme/BookTheme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrated = useHydrated();
  const [loaded, error] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Caveat_500Medium,
    Caveat_700Bold,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_700Bold,
    Fraunces_500Medium,
    Fraunces_700Bold,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Comfortaa_500Medium,
    Comfortaa_700Bold,
    LibreBaskerville_400Regular,
    LibreBaskerville_700Bold,
    Quicksand_500Medium,
    Quicksand_700Bold,
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    Bungee_400Regular,
  });

  useEffect(() => {
    if ((loaded || error) && hydrated) SplashScreen.hideAsync();
  }, [loaded, error, hydrated]);

  if ((!loaded && !error) || !hydrated) return null;

  return (
    <SafeAreaProvider>
      <BookThemeProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        </Stack>
        <LockOverlay />
      </BookThemeProvider>
    </SafeAreaProvider>
  );
}
