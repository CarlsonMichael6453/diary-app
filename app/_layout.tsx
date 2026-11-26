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
import { PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { PermanentMarker_400Regular } from '@expo-google-fonts/permanent-marker';
import { SpecialElite_400Regular } from '@expo-google-fonts/special-elite';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium, IBMPlexMono_700Bold } from '@expo-google-fonts/ibm-plex-mono';
import { Lora_400Regular, Lora_600SemiBold, Lora_700Bold } from '@expo-google-fonts/lora';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LockOverlay } from '@/src/components/LockScreen';
import { WelcomeOverlay } from '@/src/components/WelcomeOverlay';
import { SoundRoutes } from '@/src/components/SoundRoutes';
import { setVaultEncryption } from '@/src/services/vault';
import { useDiary, useHydrated } from '@/src/store/useDiary';
import { BookThemeProvider } from '@/src/theme/BookTheme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrated = useHydrated();
  const encryptAtRest = useDiary((state) => state.settings.encryptAtRest);
  useEffect(() => {
    if (!hydrated) return;
    setVaultEncryption(encryptAtRest);
    void useDiary.getState().migratePhotos();
  }, [hydrated, encryptAtRest]);
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
    PatrickHand_400Regular,
    Pacifico_400Regular,
    PermanentMarker_400Regular,
    SpecialElite_400Regular,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_700Bold,
    Lora_400Regular,
    Lora_600SemiBold,
    Lora_700Bold,
  });

  useEffect(() => {
    if ((loaded || error) && hydrated) SplashScreen.hideAsync();
  }, [loaded, error, hydrated]);

  if ((!loaded && !error) || !hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <BookThemeProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        </Stack>
        <SoundRoutes />
        <LockOverlay />
        <WelcomeOverlay />
      </BookThemeProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
