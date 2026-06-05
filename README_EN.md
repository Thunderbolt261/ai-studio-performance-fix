🇷🇺 [Русская версия](README.md) # AI Studio Performance Fix

Fixes input lag, text flickering, and scroll-fighting in **Google AI Studio** when working with long chats (200K+ tokens).

## The Problem

As context accumulates in AI Studio (200,000–500,000+ tokens), the web interface starts to lag catastrophically:

- **Input lag** — every keystroke appears with a multi-second delay
- **Text flickering** — message blocks disappear on scroll and reappear
- **Scroll-fighting** — the page jumps down during response generation, preventing reading
- **Chunky loading** — text generates in bursts of 5–10 lines instead of a smooth stream

### Why This Happens

Google AI Studio **does not use list virtualization** — the entire chat is rendered at once. At 500K tokens the DOM balloons to hundreds of thousands of nodes. Every keystroke triggers a cascading repaint of this entire tree. Plus Google has activated **Trusted Types CSP**, which blocks userscripts in Tampermonkey V3.

## The Solution

A combination of two userscripts:

1. **Trusted-Types Helper** — bypasses Trusted Types CSP blocking, allowing Tampermonkey to inject code into AI Studio
2. **AI Studio Performance Fixer** — eliminates input lag, flickering, and scroll-fighting

### What the Fix Does

| Problem | Fix Mechanic |
|---|---|
| Input lag | Disables CSS animations and `transition`, isolates message blocks via `contain: layout paint` |
| Text flickering | Tricks `IntersectionObserver` into thinking all blocks are always visible |
| Scroll-fighting | Intercepts `scrollIntoView` from AI Studio while the user is scrolling |
| Chunky loading | Removes `smooth-scroll`, text flows evenly |

## Installation

### Step 1: Install Tampermonkey

[Chrome Web Store — Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)

### Step 2: Install Trusted-Types Helper

1. Open Tampermonkey Dashboard → "Create a new script"
2. Delete the template (Ctrl+A → Delete)
3. Copy the contents of [`trusted-types-helper.user.js`](trusted-types-helper.user.js)
4. Save (Ctrl+S)

**Important:** In the Helper code find `const overwrite_default = false;` and change it to `true` for AI Studio.

### Step 3: Install AI Studio Performance Fixer

1. Create another new script in Tampermonkey
2. Delete the template
3. Copy the contents of [`ai-studio-fixer.user.js`](ai-studio-fixer.user.js)
4. Save (Ctrl+S)

**Important:** This script contains the `@inject-into page` directive, which is critical for Manifest V3.

### Step 4: Check Script Order

In Tampermonkey Dashboard, Trusted-Types Helper must execute **before** AI Studio Fixer. If Helper is lower in the list — delete both and recreate Helper first, then Fixer.

### Step 5: Verify It Works

1. Open [Google AI Studio](https://aistudio.google.com) with a long chat
2. Open console (F12 → Console)
3. Look for logs:
   ```
   Trusted-Types Helper: Trusted-Type Policies: TTP: TrustedTypePolicy {name: 'default'}
   [AI Studio Fixer v1] Performance & UI CSS injected.
   [AI Studio Fixer v1] Disappearing content/flicker fix is active.
   [AI Studio Fixer v1] Direct-control scroll fix is active.
   ```
4. Try typing in the input field — letters should appear without delay

## Troubleshooting

### Scripts don't appear in Tampermonkey on AI Studio

- Check that **"Allow userscripts"** is enabled in Tampermonkey settings (chrome://extensions → Tampermonkey → Permissions)
- Ensure Tampermonkey has access to `aistudio.google.com`

### Trusted-Types Helper works but Fixer doesn't start

- Verify the Fixer has `@inject-into page` directive
- Try enabling **Developer Mode** in Chrome (`chrome://extensions` → toggle in top right)

### Tampermonkey doesn't work on Google sites at all

If nothing helps — use **Chrome DevTools Snippets** as fallback:
1. F12 → Sources → Snippets
2. Create a new snippet, paste the Fixer code
3. Run via Ctrl+Enter every time you open AI Studio

## Requirements

- **Chrome** (or Chromium-based: Edge, Yandex.Browser)
- **Tampermonkey v5.5.0+** (Manifest V3)
- Google AI Studio with a 200K+ token chat (where the issue reproduces)

## Authors & Credits

- **AI Studio Performance Fixer** — adapted from script by [Diyar Baban](https://gist.github.com/DiyarD/dc51b79c8cf446aa662e79638f9aeba3)
- **Trusted-Types Helper** — [Benjamin Philipp](https://greasyfork.org/en/scripts/433051-trusted-types-helper)
- **Combination and Manifest V3 adaptation** — community

## Disclaimer

This is an **unofficial** fix, not affiliated with Google. Use at your own risk. The script only modifies client-side rendering and does not affect model logic or data storage.

## License

MIT License — see [LICENSE](LICENSE)
