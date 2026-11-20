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
- **Settings** — book styles for the pages and the cover, including Neon, Retro 80s, Psychedelic, Vaporwave, Galaxy, Grunge, Steampunk, Witchy, Candy, Forest, Sunset, and Cyberpunk, plus the original ten. Five animated styles are Diary Plus. A page can wear a different theme than the book.
- **Sound** — a short squeak for each pal, an original chime for each mood, and fifteen recorded CC0 page turns. Master, pal, and page-turn toggles, plus volume. The phone’s silent switch is respected.
- **Pal** — Mochi, Batsy, Sprout, Glitter, Prism, Inky, Pip, Nova, Shelly, and Ghosty, or none. Ember the baby dragon and Lumi the unicorn are Diary Plus. Pals react to the mood, the streak, and whether you are writing, and they wear accessories from games, streaks, and coins.
- **Reminder** — a local daily notification on a phone. On the web, a nudge on the diary if today’s page is still blank.
- **Lock** — opening the app shows a closed book in the current style. **Lock diary on open** asks for Face ID, fingerprint, or the passcode. On the web it asks for the passcode, or a tap if none is set. Turning the toggle off still shows the cover for a moment, then opens it. Coming back from the background locks again only while the toggle is on.
- **Feedback** — Send feedback on the diary home and in Settings. A rating and a note open an email. Diary pages are not attached.
- **Review** — after a writing streak of 3 days, or after winning a mini-game, the book may ask “Enjoying Diary App?”. Never at launch, at most every 90 days, and at most 3 times.

Four sample pages are already in the book so the calendar is not empty. Remove them in Settings.

## Paywall

Diary Plus, coin pouches, and restore are a **mock checkout**. The button says test-buy and nothing is charged. The provider lives in `src/services/purchases.ts`. To use RevenueCat later, implement the same `PurchaseProvider` interface and return it from `getPurchaseProvider()` when a real key is present. Legendary stickers and the premium pals stay behind that entitlement. Common and rare stickers can be bought with coins. Games can drop a rare sticker, and very rarely an epic one.

## Privacy and a future sync

Entries, photos, coins, and the passcode hash stay in on-device storage (AsyncStorage, plus the platform secure store for the passcode on a phone). Settings → **Save a backup** writes a versioned JSON snapshot. Restoring that file is the same shape a cloud sync would use. The empty adapter is `src/sync/adapter.ts`.

## Sounds

Each pal has a tiny synthesized squeak (no licensed audio): Mochi, Batsy, Sprout, Glitter, Prism, Inky, Pip, Nova, Shelly, Ghosty, Ember, and Lumi. Tapping the pal plays it, and so does a reaction when the streak or a save changes. Choosing a mood plays that mood’s own short original clip instead: a bright chime, a rising sparkle, a soft bell, a two-note heart, a descending minor, a muted thump, a nervous wobble, a sleepy slide, and the same kind of gentle tone for grateful and hopeful. Those clips are synthesized by `scripts/synthesize-sounds.mjs` into `assets/sounds/moods/` and stay under a second. Unlocking Diary Plus plays a longer original rising chime from `assets/sounds/plus/`. Page turns pick one of fifteen recorded CC0 clips at random and will not repeat the same clip twice in a row. They play when a page curl lands, when you change tabs or screens, when you change the calendar month, and when the cover opens. A sideways swipe anywhere on a page curls the paper with your finger. Letting go short of the turn lets the page fall back, quietly.

Settings → **Sound** has a master toggle, separate pal and page-turn toggles, and Off / Soft / Medium / Full. Playback uses `expo-audio` with `playsInSilentMode: false`, so iOS Silent and Android vibrate/silent skip the sounds. Mood chimes and the Diary Plus chime follow the master toggle and the volume. Pal squeaks, mood chimes, and the Plus chime are generated by `scripts/synthesize-sounds.mjs`. Page turns are the files in `assets/sounds/pageturn/`.

### Sound credits

Attribution is not required. These page turns are CC0. Full notes are in [`assets/sounds/pageturn/LICENSES.md`](assets/sounds/pageturn/LICENSES.md).

- `real-1-slow-journal.mp3` — Great page that turns #1, DenisChardonnet / BigSoundBank. CC0 1.0. https://bigsoundbank.com/great-page-that-turns-1-s0363.html
- `real-2-journal-rustle.mp3` — Great Page that Turns #1, DenisChardonnet / BigSoundBank. CC0 1.0. https://bigsoundbank.com/great-page-that-turns-1-s0362.html
- `real-4-book-page-turn.mp3` — Turn over the book page 1, phantastonia, with sounds by Hörspiel-Werkstatt Bad Hersfeld. CC0 1.0. https://freesound.org/people/phantastonia/sounds/457919/
- `real-5-book-page-flip.mp3` — Turn over the book page 2, phantastonia, with sounds by Hörspiel-Werkstatt Bad Hersfeld. CC0 1.0. https://freesound.org/people/phantastonia/sounds/457916/
- `real-6-heavy-sketchbook.mp3` — Paper Sketchbook Page Flips 1 (one turn), OwlStorm. Optional credit: Ashe Kirk or Owlish Media. CC0 1.0. https://freesound.org/people/OwlStorm/sounds/320148/

Each of those five also has a `-faster` and a `-slower` file. Those ten clips are speed-modified derivatives of the same CC0 sources, not new recordings. They stay CC0, and the same optional credits apply.

## Closed book

On launch the diary is a closed cover painted in the current book style, title included. **Lock diary on open** (on by default) keeps it shut until Face ID, fingerprint, or the existing passcode opens it. The web app has no biometrics, so it uses the passcode, or an Open button when a passcode has not been set. With the toggle off, the cover shows for a moment and then opens on its own, with a page-turn sound and a short cover animation. Reduce Motion skips that animation. Leaving the app and coming back closes the book again only when the toggle is on.

## Book styles

Free styles are the original ten (Cutesy, Goth, Girlypop, Rainbow, Cottagecore, Y2K, Minimal, Kawaii, Dark Academia, Ocean) plus Neon, Retro 80s, Psychedelic, Vaporwave, Galaxy, Grunge, Steampunk, Witchy, Candy, Forest, Sunset, and Cyberpunk.

Diary Plus adds the animated covers: Neon Glow, Galaxy Drift, Lava Lamp, Sparkle Rain, and Aurora. The motion is a few drifting shapes. Reduce Motion shows those styles without the movement. They use the same mock paywall as Ember and Lumi.

## Books, backups, and stats

The home screen can hold more than one book (Daily, Travel, Secrets, or whatever you name). Each book keeps the style you pick while it is open. Search can filter the open book by a tag.

**On this day** shows a page from the same month and day in an earlier year and opens it.

**Mood stats** is a year-in-pixels grid, mood counts, and “On good days you…” when a tag or activity keeps showing up on the kinder days.

Settings → **Backup** shows the last backup time and reminds you when it has been quiet. You can save JSON (plain or passphrase-encrypted), CSV, or a readable PDF. On a phone the share sheet can put the file in iCloud Drive, Google Drive, or Files. On the web it downloads, and import reads a file you choose. Day One JSON, a Day One zip that contains JSON, Daylio CSV, and plain text can be imported. Photos and settings travel inside the Diary App JSON backup.

**Encrypt entries on this device** scrambles the on-device copy with a key in the secure store. The website keeps that key in local storage, which is weaker than a phone. **Privacy** explains that diary words are not uploaded. Location and weather stay off until you turn them on, and then only coordinates go to Open-Meteo.

Voice notes, a drawing layer, and page templates (gratitude, travel, therapy recap, dream log, daily check-in, goals, blank) live on the page. Pal reminders use a pool of more than 50 sayings, skip the one just used, and stay quiet during quiet hours (10pm–7am).

Home-screen widgets (mood check-in, write today, streak, pal peek) and Apple Health / Health Connect need a development or EAS build. They do not run in Expo Go or on the website. Settings → **Widget preview** shows the cards. Stickers are the artwork only: no tile behind them. Rarity is a small glow and badge.

The first launch says there is no AI and that the diary stays on the device, with a link to backups and PDF export. The same promise is on the Privacy screen. Send feedback still emails only what you type.

**Sticker packs** in the store have a cover, a preview, and a mock price. Some cost coins and some are Diary Plus. Packs you own are grouped in the sticker album.

**Shake to open** uses the phone accelerometer. On the web, wiggling the pointer over the cover does the same thing. If the diary is locked, that motion asks for Face ID or the passcode instead of skipping it. Tap to open stays available, and Reduce Motion or the Settings toggle turns the gesture off.

## Feedback

**Send feedback** sits at the top of Settings and on the diary home. The form asks for a thumbs up or down, or 1 to 5 stars, a note, and an optional reply-to email. It adds the app version, the platform (web, iOS, or Android), and the OS version, then opens a `mailto:` link. There is no backend.

The only destination address is `FEEDBACK_EMAIL` in [`src/config.ts`](src/config.ts). If that value is ever set back to the `feedback@example.com` placeholder, the form says feedback isn’t configured and does not open a mail link.

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
