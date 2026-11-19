import { Platform } from 'react-native';

import { weatherSummary, weatherUrl } from '../logic/backup';

export type PlaceSnapshot = {
  latitude: number;
  longitude: number;
  label: string;
  temperatureC: number | null;
  summary: string | null;
};

/** Sends only coordinates to Open-Meteo. Diary text stays on the device. */
export async function capturePlace(): Promise<PlaceSnapshot | { error: string }> {
  try {
    const Location = await import('expo-location');
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return { error: 'Location permission was not granted.' };
    const position = Platform.OS === 'web'
      ? await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject))
      : null;
    const coords = position
      ? { latitude: position.coords.latitude, longitude: position.coords.longitude }
      : (await Location.getCurrentPositionAsync({})).coords;
    const response = await fetch(weatherUrl(coords.latitude, coords.longitude));
    if (!response.ok) {
      return { latitude: coords.latitude, longitude: coords.longitude, label: 'Saved place', temperatureC: null, summary: null };
    }
    const json = (await response.json()) as { current?: { temperature_2m?: number; weather_code?: number } };
    const code = json.current?.weather_code;
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      label: 'This place',
      temperatureC: json.current?.temperature_2m ?? null,
      summary: typeof code === 'number' ? weatherSummary(code) : null,
    };
  } catch {
    return { error: 'Location or weather could not be read. Nothing was sent from the diary.' };
  }
}
