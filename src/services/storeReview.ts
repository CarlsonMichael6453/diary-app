import { Platform } from 'react-native';

export type StoreReviewResult = 'requested' | 'unavailable';

/** Native in-app review. On web, and when the store cannot show a card, this is a no-op. */
export async function requestStoreReview(): Promise<StoreReviewResult> {
  if (Platform.OS === 'web') return 'unavailable';
  try {
    const StoreReview = await import('expo-store-review');
    if (!(await StoreReview.isAvailableAsync())) return 'unavailable';
    if (!(await StoreReview.hasAction())) return 'unavailable';
    await StoreReview.requestReview();
    return 'requested';
  } catch {
    return 'unavailable';
  }
}
