import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { feedbackPlatform } from '../logic/feedback';

export type FeedbackDevice = {
  appVersion: string;
  platform: 'web' | 'iOS' | 'Android';
  osVersion: string;
};

function osVersion(): string {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined') return 'web';
    return navigator.userAgent || 'web';
  }
  if (Platform.OS === 'android') {
    const release = (Platform.constants as { Release?: string } | undefined)?.Release;
    if (release) return release;
  }
  if (Platform.Version == null) return 'unknown';
  return String(Platform.Version);
}

export function readFeedbackDevice(): FeedbackDevice {
  const nativeVersion = (Constants as { nativeAppVersion?: string | null }).nativeAppVersion;
  return {
    appVersion: Constants.expoConfig?.version || nativeVersion || 'unknown',
    platform: feedbackPlatform(Platform.OS),
    osVersion: osVersion(),
  };
}
