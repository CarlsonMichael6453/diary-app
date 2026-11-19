import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import type { ReviewMoment } from '../logic/review';
import { offerReview } from '../services/reviewPrompt';
import { requestStoreReview } from '../services/storeReview';
import { useTheme } from '../theme/BookTheme';
import { Button } from './ui';

export function useReviewMoment() {
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const consider = useCallback(async (moment: ReviewMoment, writingStreak?: number) => {
    if (visibleRef.current) return;
    const show = await offerReview(moment, writingStreak);
    if (show && mounted.current) {
      visibleRef.current = true;
      setVisible(true);
    }
  }, []);

  const hide = useCallback(() => {
    visibleRef.current = false;
    setVisible(false);
  }, []);

  return { visible, consider, hide };
}

export function ReviewPrompt({ onClose, onFeedback }: { onClose: () => void; onFeedback: () => void }) {
  const theme = useTheme();
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function yes() {
    if (busy) return;
    setBusy(true);
    const result = await requestStoreReview();
    if (result === 'requested') {
      onClose();
      return;
    }
    setBusy(false);
    setNote('Thanks. The store review opens in the iOS and Android apps.');
  }

  return (
    <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(20,16,20,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 40 }}>
      <View style={{ width: '100%', maxWidth: 420, backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 18 }}>
        {note ? (
          <>
            <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26 }}>Thank you</Text>
            <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 15, marginTop: 8 }}>{note}</Text>
            <Button label="Close" onPress={onClose} style={{ marginTop: 16 }} />
          </>
        ) : (
          <>
            <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26 }}>Enjoying Diary App?</Text>
            <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 15, marginTop: 8 }}>
              Yes opens a short store review. Otherwise you can send a note. Your diary entries are never included.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <Button label="Not really" tone="ghost" onPress={onFeedback} style={{ flex: 1 }} />
              <Button label="Yes" onPress={() => void yes()} disabled={busy} style={{ flex: 1 }} />
            </View>
            <Button label="Not now" tone="ghost" onPress={onClose} style={{ marginTop: 8 }} />
          </>
        )}
      </View>
    </View>
  );
}
