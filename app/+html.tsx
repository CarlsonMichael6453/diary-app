import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Diary App</title>
        <meta name="description" content="A scrapbook diary for the web, iPhone, and Android." />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `body { background-color: #FFF1F4; } @media (prefers-color-scheme: dark) { body { background-color: #161218; } }`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
