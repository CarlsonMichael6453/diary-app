import { useState } from 'react';
import { Linking, Pressable, Text, TextInput, View } from 'react-native';

import { Screen } from '@/src/components/Screen';
import { Button, FieldLabel } from '@/src/components/ui';
import { FEEDBACK_EMAIL, isFeedbackConfigured } from '@/src/config';
import { buildFeedbackPayload, feedbackMailUrl, type FeedbackRating } from '@/src/logic/feedback';
import { readFeedbackDevice, type FeedbackDevice } from '@/src/services/deviceInfo';
import { useTheme } from '@/src/theme/BookTheme';

const STARS = [1, 2, 3, 4, 5] as const;

export default function FeedbackScreen() {
  const theme = useTheme();
  const configured = isFeedbackConfigured();
  const [device] = useState<FeedbackDevice>(() => readFeedbackDevice());
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [notice, setNotice] = useState('');

  function submit() {
    if (!configured) {
      setNotice('Feedback isn’t configured yet, so nothing was sent.');
      return;
    }
    if (!rating) {
      setNotice('Choose thumbs or a star rating first.');
      return;
    }
    const payload = buildFeedbackPayload({
      rating,
      message,
      replyTo,
      appVersion: device.appVersion,
      platform: device.platform,
      osVersion: device.osVersion,
    });
    if (!payload) return;
    const url = feedbackMailUrl(FEEDBACK_EMAIL, payload);
    if (!url) {
      setNotice('Feedback isn’t configured yet, so nothing was sent.');
      return;
    }
    setNotice('');
    void Linking.openURL(url);
  }

  const starValue = typeof rating === 'number' ? rating : null;

  return (
    <Screen>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 36, marginTop: 8 }}>Send feedback</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginTop: 4 }}>
        A rating, a note, and an optional email if you want a reply. Your diary entries are never included.
      </Text>

      {configured ? null : (
        <View style={{ marginTop: 12, backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 14 }}>
          <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 15 }}>
            Feedback isn’t set up on this build yet. The inbox is still the placeholder, so this form can’t open an email. Nothing is sent.
          </Text>
        </View>
      )}

      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 22, marginTop: 18 }}>How does it feel?</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Thumb label="👍" name="Thumbs up" selected={rating === 'up'} onPress={() => setRating('up')} />
        <Thumb label="👎" name="Thumbs down" selected={rating === 'down'} onPress={() => setRating('down')} />
      </View>
      <FieldLabel>Or stars</FieldLabel>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
        {STARS.map((star) => {
          const on = starValue != null && star <= starValue;
          return (
            <Pressable key={star} accessibilityRole="button" accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`} onPress={() => setRating(star)}>
              <Text style={{ fontSize: 32, color: on ? theme.colors.accent : theme.colors.inkSoft }}>{on ? '★' : '☆'}</Text>
            </Pressable>
          );
        })}
      </View>

      <FieldLabel>Note</FieldLabel>
      <TextInput
        value={message}
        onChangeText={setMessage}
        multiline
        placeholder="What should we know?"
        placeholderTextColor={theme.colors.inkSoft}
        style={inputStyle(theme, 120)}
      />
      <FieldLabel>Reply-to email (optional)</FieldLabel>
      <TextInput
        value={replyTo}
        onChangeText={setReplyTo}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="name@email.com"
        placeholderTextColor={theme.colors.inkSoft}
        style={inputStyle(theme, 46)}
      />

      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 22, marginTop: 8 }}>Added automatically</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginTop: 4 }}>App version {device.appVersion}</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>Platform {device.platform}</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>OS version {device.osVersion}</Text>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.body, marginTop: 8 }}>Your diary entries are never included.</Text>

      <Button label="Send feedback" onPress={submit} disabled={!configured || !rating} style={{ marginTop: 16 }} />
      {notice ? <Text style={{ color: theme.colors.ink, fontFamily: theme.body, marginTop: 10 }}>{notice}</Text> : null}
    </Screen>
  );
}

function Thumb({ label, name, selected, onPress }: { label: string; name: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minWidth: 64,
        minHeight: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? theme.colors.accent : theme.colors.chip,
      }}
    >
      <Text style={{ fontSize: 24 }}>{label}</Text>
    </Pressable>
  );
}

function inputStyle(theme: ReturnType<typeof useTheme>, minHeight: number) {
  return {
    backgroundColor: theme.colors.card,
    color: theme.colors.ink,
    fontFamily: theme.body,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    minHeight,
    textAlignVertical: 'top' as const,
  };
}
