import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Missing page' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#FFF1F4' }}>
        <Text style={{ fontSize: 28, marginBottom: 12 }}>That page is not in the book.</Text>
        <Link href="/">
          <Text style={{ fontSize: 16 }}>Back to the diary</Text>
        </Link>
      </View>
    </>
  );
}
