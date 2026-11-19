# Diary App

A scrapbook diary for Michael that runs as a website and as an iOS and Android app from one Expo codebase. Pages stay on the device. Themes, stickers, a little pal, and three mini-games all live in the same book.

## Run it on the web

```bash
npm install
npm run web
```

Open [http://localhost:43123](http://localhost:43123).

## Open it on a phone with Expo Go

1. Install [Expo Go](https://expo.dev/go) from the App Store or Google Play. This project uses Expo SDK 58, so update Expo Go if it says the project is too new.
2. From this folder:

```bash
npm install
npx expo start
```

3. Phone and computer on the same Wi-Fi: scan the QR code with the iOS camera or with Expo Go on Android.
4. If the phone is on another network, start with a tunnel instead:

```bash
npx expo start --tunnel
```

`npm run ios` and `npm run android` open a simulator or emulator when you have one installed. iOS builds need macOS.

## Live website

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) exports the web app and deploys it to GitHub Pages on every push to `main`. After the repository exists as `CarlsonMichael6453/diary-app` and Pages is set to **GitHub Actions** (Settings → Pages), the site is:

[https://carlsonmichael6453.github.io/diary-app/](https://carlsonmichael6453.github.io/diary-app/)

## What’s in the book

- **Diary** — more than one page a day, written on paper that matches the theme. A daily prompt is chosen from a built-in list and stays the same all day.
- **Mood** — one mood per page, with an emoji and a color. The calendar tints that day with it.
- **Photos** — up to four per page, stored with the page.
- **Stickers** — drag to place, drag the gold dot to resize, and use Rotate. There are 100+ original SVG stickers in themed packs.
- **Calendar** — month grid. Tap a day to open its pages or start one.
- **Search** — any word, with the matches highlighted.
- **Games** — memory match, sticker catch, and a once-a-day spin. They pay coins, and sometimes a sticker or an accessory. A daily visit gift and a writing-streak bonus stack on top.
- **Settings** — ten book themes (Cutesy, Goth, Girlypop, Rainbow, Cottagecore, Y2K, Minimal, Kawaii, Dark Academia, Ocean). A page can wear a different theme than the book.
- **Pal** — Mochi, Batsy, Sprout, Glitter, Prism, Inky, Pip, Nova, Shelly, and Ghosty, or none. Ember the baby dragon and Lumi the unicorn are Diary Plus. Pals react to the mood, the streak, and whether you are writing, and they wear accessories from games, streaks, and coins.
- **Reminder** — a local daily notification on a phone. On the web, a nudge on the diary if today’s page is still blank.
- **Lock** — a 4-digit passcode. Face ID and fingerprint are offered on a phone that has them enrolled.
- **Feedback** — Send feedback on the diary home and in Settings. A rating and a note open an email. Diary pages are not attached.
- **Review** — after a writing streak of 3 days, or after winning a mini-game, the book may ask “Enjoying Diary App?”. Never at launch, at most every 90 days, and at most 3 times.

Four sample pages are already in the book so the calendar is not empty. Remove them in Settings.

## Paywall

Diary Plus, coin pouches, and restore are a **mock checkout**. The button says test-buy and nothing is charged. The provider lives in `src/services/purchases.ts`. To use RevenueCat later, implement the same `PurchaseProvider` interface and return it from `getPurchaseProvider()` when a real key is present. Legendary stickers and the premium pals stay behind that entitlement. Common and rare stickers can be bought with coins. Games can drop a rare sticker, and very rarely an epic one.

## Privacy and a future sync

Entries, photos, coins, and the passcode hash stay in on-device storage (AsyncStorage, plus the platform secure store for the passcode on a phone). Settings → **Save a backup** writes a versioned JSON snapshot. Restoring that file is the same shape a cloud sync would use. The empty adapter is `src/sync/adapter.ts`.

## Feedback

**Send feedback** sits at the top of Settings and on the diary home. The form asks for a thumbs up or down, or 1 to 5 stars, a note, and an optional reply-to email. It adds the app version, the platform (web, iOS, or Android), and the OS version, then opens a `mailto:` link. There is no backend.

The only destination address is `FEEDBACK_EMAIL` in [`src/config.ts`](src/config.ts).

**TODO:** change `feedback@example.com` to a real inbox before you rely on feedback. While that placeholder is still set, the form says feedback isn’t configured and does not open a mail link.

The form says “Your diary entries are never included.” The mail body is only the rating, the note, the optional reply-to, the version, the platform, and the OS version. Entries, titles, moods, photos, search terms, and sticker data are not read and not attached.

## Store review

A polite “Enjoying Diary App?” can appear right after a page is saved on a writing streak of at least 3 days, or after a mini-game win (memory, a catch round with a score, or the daily spin). It does not appear at launch. Yes opens the native in-app review through `expo-store-review`. On the web that call is a no-op and the prompt says the store card opens on iOS and Android. Not really opens Send feedback.

The last-asked time and the count are stored on the device, apart from the diary. The gap is 90 days and the cap is 3 asks. Those thresholds live next to `FEEDBACK_EMAIL` in [`src/config.ts`](src/config.ts).

## Tests

```bash
npm test
```

## Adding a pal

1. Add a `BuddyDef` in `src/buddies/catalog.ts` (copy, perch, anchors, premium flag).
2. Draw the pal in `src/buddies/BuddyView.tsx` and register it on `BUDDY_DRAW`.

Accessories are an `OutfitDef` plus a branch in `drawOutfit`.

## Adding a sticker

Add a row in `src/stickers/catalog.ts`. If the art is new, add a key to `ART_KEYS` and a drawing function in `src/stickers/art.ts`.
