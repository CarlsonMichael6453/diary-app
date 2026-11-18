import { Platform } from 'react-native';

export async function biometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const LocalAuthentication = await import('expo-local-authentication');
    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return hardware && enrolled;
  } catch {
    return false;
  }
}

export async function unlockWithBiometric(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const LocalAuthentication = await import('expo-local-authentication');
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock your diary',
      cancelLabel: 'Use passcode',
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}
