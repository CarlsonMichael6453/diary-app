export type PageTemplate = {
  id: string;
  name: string;
  title: string;
  body: string;
};

export const TEMPLATES: PageTemplate[] = [
  { id: 'blank', name: 'Blank', title: '', body: '' },
  {
    id: 'gratitude',
    name: 'Gratitude',
    title: 'Grateful for',
    body: 'Three things:\n1. \n2. \n3. \n\nWhy the smallest one still matters:\n',
  },
  {
    id: 'travel',
    name: 'Travel',
    title: 'From the road',
    body: 'Where I am:\nWhat I noticed first:\nA taste or a sound:\nSomething I do not want to forget:\n',
  },
  {
    id: 'therapy',
    name: 'Therapy recap',
    title: 'After the session',
    body: 'What we talked about:\nWhat I felt in my body:\nOne thing to try before next time:\n',
  },
  {
    id: 'dream',
    name: 'Dream log',
    title: 'Last night',
    body: 'The dream, as I remember it:\nThe feeling it left:\nA detail that was oddly specific:\n',
  },
  {
    id: 'checkin',
    name: 'Daily check-in',
    title: 'Check-in',
    body: 'Body:\nMood:\nOne need:\nOne good thing:\n',
  },
  {
    id: 'goals',
    name: 'Goals',
    title: 'What I am aiming at',
    body: 'The goal:\nA tiny step for today:\nWhat would make it kinder:\n',
  },
];

export function getTemplate(id: string | null | undefined): PageTemplate {
  return TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0];
}
