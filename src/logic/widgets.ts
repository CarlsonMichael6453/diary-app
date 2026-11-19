export type WidgetCard = {
  id: 'mood' | 'write' | 'streak' | 'buddy';
  title: string;
  body: string;
};

export function widgetCards(input: {
  buddyName: string;
  buddyEmoji: string;
  streak: number;
  wroteToday: boolean;
  saying: string;
}): WidgetCard[] {
  return [
    { id: 'mood', title: 'Mood check-in', body: input.wroteToday ? 'You already left a mood today.' : 'How does today feel?' },
    { id: 'write', title: 'Write today', body: input.wroteToday ? 'Add another page if you want.' : 'Today’s page is still open.' },
    { id: 'streak', title: 'Streak', body: input.streak > 0 ? `${input.streak} day${input.streak === 1 ? '' : 's'} of writing` : 'Start a one-day streak.' },
    { id: 'buddy', title: input.buddyName, body: `${input.buddyEmoji} ${input.saying}` },
  ];
}

export const WIDGET_BUILD_NOTE = 'Home-screen widgets need a development or EAS build. They do not run in Expo Go or on the web. This screen is the preview.';
