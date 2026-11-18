import { Text, type TextStyle } from 'react-native';

import { splitHighlight } from '../logic/search';
import { useTheme } from '../theme/BookTheme';

export function Highlight({ text, query, style }: { text: string; query: string; style?: TextStyle }) {
  const theme = useTheme();
  const parts = splitHighlight(text, query);
  return (
    <Text style={style}>
      {parts.map((part, index) =>
        part.hit ? (
          <Text key={index} style={{ backgroundColor: theme.colors.highlight, color: theme.colors.paperInk }}>
            {part.text}
          </Text>
        ) : (
          <Text key={index}>{part.text}</Text>
        ),
      )}
    </Text>
  );
}
