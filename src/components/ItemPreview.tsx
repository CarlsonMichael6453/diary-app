import type { ReactNode } from 'react';
import { Modal, Pressable, Text } from 'react-native';

import { useTheme } from '../theme/BookTheme';
import { Button } from './ui';

export function ItemPreview({
  visible,
  title,
  detail,
  onClose,
  actionLabel,
  onAction,
  children,
}: {
  visible: boolean;
  title: string;
  detail?: string;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close preview" onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(42,24,28,0.42)', justifyContent: 'center', padding: 22 }}>
        <Pressable
          onPress={() => undefined}
          style={{ backgroundColor: theme.colors.paper, borderRadius: 22, borderWidth: 1, borderColor: theme.colors.paperEdge, padding: 16, alignItems: 'center', gap: 8 }}
        >
          {children}
          <Text style={{ color: theme.colors.paperInk, fontFamily: theme.display, fontSize: 28, textAlign: 'center' }}>{title}</Text>
          {detail ? <Text style={{ color: theme.colors.paperSoft, fontFamily: theme.body, textAlign: 'center' }}>{detail}</Text> : null}
          {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
          <Button label="Close" tone="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
