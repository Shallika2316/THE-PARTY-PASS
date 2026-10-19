# The Party Pass by KoiKoi (Inkpenlabs)

An interactive party invitation. The host personalises an invite, picks a mini-game the guest must win to unlock it, adds a soundtrack and shares a private link. The guest plays, unlocks the details, adds the party to their calendar and RSVPs.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (also exposed on your LAN for phone testing)
npm run build      # type-checks, then builds to dist/
npm run preview    # serves the production build
```

To deploy, upload `dist/` to any static host. The app uses client-side routes (`/invite/:id`), so every path must fall back to `index.html`. `public/_redirects` (Netlify) and `vercel.json` (Vercel) already handle this.

## Routes

| Path | Screen |
| --- | --- |
| `/` | The card's intro screen (hero) · `?preview=1` opens the guest demo. Header links go to koikoiapp.com |
| `/create/personalise` | Step 1 · party type, names, vibe (`?type=dinner` preselects a party type) |
| `/create/event-details` | Step 2 · date, time, venue, privacy, dress code, message |
| `/create/choose-game` | Step 3 · Crack the Code / Find the Vibe / Piece Together the Party, plus game setup |
| `/create/music` | Optional soundtrack |
| `/create/preview` | Final screen: invite preview, auto-playing guest walkthrough in a phone, pricing and Unlock |
| `/create/publish` | After unlock: the shareable link |
| `/invite/:id?d=…` | Guest welcome and game |
| `/invite/:id/reveal` | Unlocked invitation, calendar, directions, RSVP |
| `/invite/:id/rsvp` | RSVP confirmation |
| `/legal` | Privacy, terms and music credits |

## Layout

The intro screen, every creation step and the final screen fit the browser window; the page itself never scrolls. On very short screens or phones, only the card's content scrolls while Continue stays pinned (`src/styles/viewport.css`). Large previews use `FitScale`, which renders at a fixed design width and scales down to fit.

## How it works

- **State.** `src/lib/store.tsx` holds the invitation draft (model in `src/lib/types.ts`) and saves it to `localStorage`, so a refresh or going back never loses work. Steps can't be skipped: the create layout redirects to the first incomplete step.
- **Guest links work on any device without a backend.** Publishing builds a guest-safe copy of the invitation (`toGuestInvite`) and encodes it into the link (`?d=`). Host-only data is removed.
- **Secret answers stay out of the link.** Crack the Code stores only a salted SHA-256 verifier. Answers are normalised, so case, accents, punctuation and a leading "the/a/an" don't matter. A private location is XOR-encrypted with a key derived from the answer, so it is only readable after a correct guess.
- **Games.** All three are playable with touch, mouse and keyboard. The word-search grid and puzzle shuffle come from a seeded generator, so the host's preview matches exactly what the guest gets.
- **Music.** Search, artwork and 30-second previews come from Apple's public iTunes Search API (no key needed), and every song links back to Apple Music. One shared audio element plays one song at a time. Hosts can instead paste a Spotify song link ("Have a Spotify link instead?"): the title and artwork fill in from Spotify's public oEmbed endpoint, and guests play it in Spotify's own embedded player, so Spotify songs aren't trimmed to 15 seconds.
- **Soundtrack clip.** The host drags a 15-second window over the preview's real waveform (decoded in the browser; Apple allows cross-origin reads). Guests hear exactly that moment. The final screen loops it alongside the walkthrough, with a tap-to-play fallback if the browser blocks sound.
- **Motion.** Framer Motion plus CSS. `MotionConfig reducedMotion="user"` and a `prefers-reduced-motion` stylesheet tone everything down; confetti is skipped entirely.

## Prototype limitations

- **No server.** Invitations live in the link itself and in the host's browser. A production build should store them server-side and issue short links.
- **Answers are checked in the browser.** The plaintext answer never ships, but the verifier could be brute-forced offline. Production should verify guesses server-side with rate limiting.
- **Private locations in Find the Vibe and the puzzle** are only base64-encoded, since there's no secret to derive a key from. The legal page says so.
- **RSVPs are saved on the guest's device only.** The host is not notified. The confirmation screen says this and offers a prefilled WhatsApp message to the host instead.
- **No real payments.** Checkout is clearly labelled as a prototype and the prices are illustrative.
- **Form background** (`public/img/form-plate.webp`) is the supplied Personalise reference with its header, progress bar and card removed the same way.
- **Hero imagery** (`public/img/hero-plate.webp`) is the supplied editorial hero with its baked-in text removed (filled from the surrounding pixels); the page's real text, buttons, mirrorball glints and spinning record label sit on top as live HTML/SVG. `hero-collage.webp` is the collage-only crop used on phones.
- **Party photos** in `public/img` are crops of the supplied "Good People, Good Times" collage. Disco balls, stars, glassware, vinyl, tickets and ribbon are drawn in SVG/CSS.
