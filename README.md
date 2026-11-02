# KiCo — India's Kitaab Copy (`kicoedtech.xyz`)

A complete, zero-build, production-ready rebuild of **KiCo (India's Kitaab Copy)** — the 12-week live online **Digital Marketing Mastery Program** founded by IIT Delhi alumnus Gunjan Chowdhary and powered by Mainspring India.

Built with plain static HTML, CSS custom properties (design tokens), and vanilla JavaScript so it deploys directly on GitHub Pages, Vercel, or Netlify without a bundler or backend.

---

## 1. Pages and Files

| Path | Purpose |
| :--- | :--- |
| `index.html` | Main landing page with all 11 sections, 29-module syllabus, live 12-week planner, honest `[data-ui]` work artefacts, single-open accordions, WhatsApp enquiry form, and WebGL Liquid Glass bar |
| `privacy-policy.html` | Plain-English Privacy Policy (including disclosure that the enquiry form stores nothing on the site) |
| `terms-conditions.html` | Plain-English Terms & Conditions (training provider scope, 18+ or guardian consent, non-refundable fees once access is granted, IP protection, Indian law) |
| `disclaimer.html` | Plain-English Disclaimer (educational purpose, no placement or income guarantee, paid programme disclosure) |
| `comment-policy.html` | Plain-English Comment Policy (constructive criticism welcome, no personal attacks, open moderation, spam/hate removal rules) |
| `404.html` | Custom 404 page using root-relative paths (`/assets/...`) so it resolves at any URL depth |
| `assets/css/site.css` | Single stylesheet driven entirely by CSS custom properties (design tokens) plus `liquid-glass-js` layout rules |
| `assets/js/site.js` | Single script for header glass state, hero crossfade, WebGL glass mounting, 12-week planner, accordions, form validation, and `IntersectionObserver` reveals |
| `assets/js/glass/container.js` | Vendored & patched `dashersw/liquid-glass-js` `Container` class (`Container.snapshotTarget`, scroll-cancelled `getPosition()`, silent fallback to `html.glass-fallback`) |
| `assets/js/glass/button.js` | Vendored `dashersw/liquid-glass-js` `Button` class extending `Container` |
| `assets/js/glass/LICENSE` | MIT License for `dashersw/liquid-glass-js` |
| `assets/vendor/html2canvas.min.js` | Local vendored `html2canvas@1.4.1` build for DOM snapshot sampling |
| `assets/fonts/*.woff2` | Self-hosted WOFF2 fallback fonts (`Inter-Regular.woff2`, `Inter-Medium.woff2`, `Inter-SemiBold.woff2`, `InterDisplay-SemiBold.woff2`) |
| `assets/og.png` | 1200×630 Open Graph social share preview image captured from the live hero |
| `favicon.svg` | Vector notebook-margin + `K` monogram icon |
| `robots.txt` & `sitemap.xml` | Search engine indexing rules and XML sitemap for `https://kicoedtech.xyz/` |
| `.nojekyll` & `.gitignore` | GitHub Pages static bypass marker and git exclusions (`.taste-skill/`, `node_modules/`) |

---

## 2. Working Features

1. **Interactive 12-Week Start-Date Planner (`#planner-start`)**:
   - Defaults to next Monday with `min` locked to today.
   - Calculates the Friday of Week 12 and announces the start and finish dates in a polite `aria-live` summary formatted with the `en-IN` locale.
   - Rewrites all five syllabus stage headers with real calendar windows (e.g., `Weeks 3–5, 23 Nov – 11 Dec`) from each stage's `data-week-start` and `data-week-end` attributes.
   - Syncs the selected date into the enquiry form's "Preferred start date" input unless the visitor has manually edited that field.
2. **Enquiry Form → WhatsApp Handover (`#enquiry-form`)**:
   - Validates full name (`> 1` char), 10-digit Indian mobile number starting `6–9` (optional `+91`, spaces/hyphens allowed, tied to `#phone-hint` via `aria-describedby`), valid email, and required consent checkbox.
   - Marks invalid inputs with `aria-invalid="true"`, focuses the first invalid field, announces the error in a `role="status"` region, and clears `aria-invalid` as the user types.
   - On valid submit, opens `https://wa.me/919315939588?text=...` in a new tab (`win.opener = null`) with all entered fields cleanly formatted, and displays a confirmation note with a prefilled `mailto:admin@kicoedtech.xyz` fallback (or direct clickable links if pop-ups are blocked).
3. **Patched WebGL Liquid Glass (`assets/js/glass/`) + Accessible Fallback**:
   - Mounts a pill `Container` with three pill `Button`s (`12 weeks`, `Live online`, `Certified`) in the hero after `window.load` and `document.fonts.ready`.
   - Uses `Container.snapshotTarget = document.getElementById('hero-section')` so `html2canvas` only captures the hero rather than the entire long document.
   - Each glass button is keyboard-operable (`role="link"`, `tabindex="0"`, `aria-label`, `Enter`/`Space` support) and scrolls smoothly to its target section.
   - Maintains a plain HTML fallback list (`.hero-facts-fallback`) styled with CSS `backdrop-filter`, automatically restored via `MutationObserver` if `glass-fallback` is added to `<html>`.
4. **Accessible Single-Open Accordions & FAQs**:
   - Both "How the 12 weeks run" (5 steps) and the FAQ (7 questions, first open on load) use semantic `<button aria-expanded aria-controls>` triggers, enforce single-open behaviour, hide closed panels with `hidden` + `visibility: hidden`, and move focus to the opened panel content.
5. **Hero Work-Artefact Crossfade & Section Entrances**:
   - Cycles through four realistic `[data-ui]` deliverables (SEO listing, Meta ad campaign, GA4 conversion chart, Automated email flow) stacked in a single `grid-area: 1 / 1` cell so container height never jumps; pauses on `visibilitychange` and disables under `prefers-reduced-motion: reduce`.

---

## 3. Design Approach & How the Three Reference Repositories Were Used

1. **`Leonxlnx/taste-skill` (`skills/taste-skill/SKILL.md`)**:
   - Followed the complete v2 pipeline: subject inventory (10 client-specific facts), section-by-section claim/proof argument, dealing a direction via `draw.mjs` (`artefact-ledger`, seed `d359b348`), formulating the competitor-tested idea sentence (*"Kitaab vs. Copy"* open-flat workbook), writing the copy deck under the 2-line headline ceiling, and verifying with `lint.mjs` and `inspect.mjs` at `1440px`, `768px`, and `390px`.
   - Honest `[data-ui]` HTML/CSS interface fragments replace missing client photography without using stock photos of strangers or inventing fake student reviews/placement statistics.
   - Intentional exception: `taste-skill` bans glass (`backdrop-filter`), which was explicitly requested for the scrolled header and `liquid-glass-js` integration; those rules carry `taste-skill-ignore` comments and are inspected with `--allow glass`.
2. **`VoltAgent/awesome-design-md`**:
   - Used as the structural model for `assets/css/site.css`: semantic colour roles (`--bg`, `--surface`, `--surface-strong`, `--ink`, `--muted`, `--accent`, `--field-dark`), a 5-step fluid `clamp()` type scale (`--step-small` to `--step-display`), layout spacing (`--margin`, `--gutter`, `--section`), a single architectural radius token (`--radius: 4px`), and motion easing tokens.
3. **`dashersw/liquid-glass-js`**:
   - Vendored locally into `assets/js/glass/container.js` and `assets/js/glass/button.js` with its MIT license and top-of-file credit comments, paired with `assets/vendor/html2canvas.min.js` and patched for scoped hero snapshots, scroll-compensated coordinates, zero console noise, and graceful fallback.

---

## 4. Running Locally

Serve the root folder over any static HTTP server (required for WebGL texture loading and root-relative links):

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

---

## 5. Deploying on GitHub Pages & Connecting `kicoedtech.xyz`

1. Push the repository to GitHub on branch `main`.
2. In your GitHub repository, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, select **Deploy from a branch**, choose branch **`main`** and folder **`/ (root)`**, and click **Save**.
4. To connect the custom domain **`kicoedtech.xyz`**:
   - Enter `kicoedtech.xyz` in the **Custom domain** field under **Settings → Pages** and save (this creates a `CNAME` record).
   - At your DNS provider for `kicoedtech.xyz`, point apex `A` records to GitHub Pages (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) and a `CNAME` record for `www` to `<your-github-username>.github.io`.
   - Once DNS propagates, tick **Enforce HTTPS**.

---

## 6. Credits & Licences

- **Liquid Glass JS (`assets/js/glass/`)**: Copyright (c) 2025 Armagan Amcalar (`@dashersw`), licensed under the **MIT License** (`assets/js/glass/LICENSE`).
- **html2canvas (`assets/vendor/html2canvas.min.js`)**: Copyright (c) Niklas von Hertzen, licensed under the **MIT License**.
- **Typography**:
  - **Fraunces** & **Plus Jakarta Sans** loaded via Google Fonts under the **SIL Open Font License 1.1 (OFL-1.1)**.
  - **Inter / Inter Display** self-hosted fallback WOFF2 files (`assets/fonts/`) by Rasmus Andersson under the **SIL Open Font License 1.1 (OFL-1.1)**.

---

## 7. Confirm With the Client Before Launch (Handover Checklist)

- [ ] **Course fees not shown publicly**: Visitors are prompted to contact KiCo on WhatsApp or via the enquiry form for current batch fees, one-time payment discounts, and instalment plans. Confirm if Gunjan wants a starting fee figure published later.
- [ ] **Two conflicting New Delhi addresses**: The old home page footer listed `06, DDA Staff QTR, Ber Sarai, New Delhi 110016`, while the old Contact and Privacy pages listed `G-10, Pocket-7, Dwarka Sector 12, New Delhi`. Both are displayed clearly as the Ber Sarai and Dwarka offices; confirm which is primary or if both should remain.
- [ ] **Missing social media links**: The old WordPress site had empty `#` placeholder links for Facebook, X, and Instagram. Dead links have been omitted so visitors never hit broken buttons; add real profile URLs once the client provides them.
- [ ] **No real photographs yet**: The old site had empty gallery and testimonial blocks and no photo of founder Gunjan Chowdhary. We used honest `[data-ui]` curriculum and deliverable visuals instead of stock photos or invented testimonials. Real session photographs and a portrait of Gunjan Chowdhary will strengthen the Founder and Hero sections when available.
- [ ] **Illustrative sample business in `[data-ui]` fragments**: The interface fragments (SEO search snippet, Meta ad card, GA4 conversion bar chart, email flow, campaign brief) use an obviously illustrative sample local business (*"Dilli Darbar Roasters, Ber Sarai"*) and sample numbers to demonstrate what learners build. Swap these with real anonymised student project screenshots if desired.
- [ ] **Proposed 12-week module order**: All 29 original syllabus modules are preserved and grouped into a logical 5-stage, 12-week sequence (Weeks 1–2 Foundations → Weeks 3–5 Web & Search → Weeks 6–8 Social & Video → Weeks 9–10 Leads, Commerce & Monetisation → Weeks 11–12 Analytics, Reporting & Internship). Confirm this sequence with Gunjan Chowdhary.
- [ ] **Plain-English legal pages**: `privacy-policy.html`, `terms-conditions.html`, `disclaimer.html`, and `comment-policy.html` preserve all original legal substance in cleaner wording and state that the static form stores no data on the site. Have the client review the final wording before launch.
- [ ] **Open Graph share image (`assets/og.png`)**: Currently generated at 1200×630 from the live hero design; can be replaced with a custom branded banner or founder photo card anytime.
