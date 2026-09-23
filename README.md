# Slop Detector

A Chrome MV3 extension that marks likely AI slop in the X feed in real time as you scroll.

## How It Works

1. As you scroll your feed on x.com, visible cards are detected by an IntersectionObserver.
2. The card text is sent to a local server relay.
3. The relay calls TypeSafe Jev System One model (jev-latest) with a single calibrated score question.
4. Cards scoring 80 and above receive a compact pill badge reading LIKELY AI SLOP with the score.
5. Cards scoring 40 to 79 receive an amber CHECK THIS outline.
6. Cards scoring under 40 remain completely untouched.
7. Content is never hidden, removed, collapsed, or blurred. All overlays are non-destructive and additive.

## Setup

1. Start the relay server:
   ```bash
   node relay/server.js
   ```
   Ensure `TYPESAFE_API_KEY` is exported in your environment.

2. Load the extension in your browser:
   - Open Edge or Chrome and navigate to `edge://extensions` or `chrome://extensions`.
   - Enable Developer mode.
   - Click "Load unpacked" and select this workspace folder.

3. Navigate to `https://x.com` and scroll your feed.

## Testing

Run unit tests:
```bash
node --test judge.test.js
```
