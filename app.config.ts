import type { ExpoConfig } from 'expo/config';

type ExpoJson = { expo: ExpoConfig };

const app = require('./app.json') as ExpoJson;

const config: ExpoConfig = {
  ...app.expo,
  name: 'Diary App',
  slug: 'diary-app',
  scheme: 'diaryapp',
  web: {
    ...app.expo.web,
    output: 'single',
  },
  plugins: [...(app.expo.plugins ?? []), 'expo-sharing', './plugins/withDiaryWidgets'],
  experiments: {
    ...app.expo.experiments,
    typedRoutes: true,
    ...(process.env.GITHUB_PAGES === '1' ? { baseUrl: '/diary-app' } : {}),
  },
};

export default config;
