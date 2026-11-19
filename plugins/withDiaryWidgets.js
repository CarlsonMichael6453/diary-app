/** Marks the project for WidgetKit and Android home-screen widgets.
 * The native widgets themselves are compiled in a development or EAS build, not in Expo Go or the web export.
 */
module.exports = function withDiaryWidgets(config) {
  config.extra = {
    ...(config.extra ?? {}),
    diaryWidgets: {
      ios: 'WidgetKit',
      android: 'AppWidgetProvider',
      requiresDevBuild: true,
      kinds: ['mood-check-in', 'write-today', 'streak', 'buddy-peek'],
    },
  };
  return config;
};
