# Cyanotype

> **Digital Negative Generator for Cyanotype Alternative Photography**  
> 🔗 **Live Production Site:** [https://blueprinting.pages.dev](https://blueprinting.pages.dev)

Cyanotype is a privacy-first, client-side web application designed to transform regular photos into inverted grayscale digital negatives ready for contact printing onto transparency films (e.g. for classic cyanotype, Van Dyke brown, or platinum/palladium alternative photographic processes).

**All processing runs 100% locally in your browser.** No images are uploaded to any server.

---

## Features

- **Client-Side Processing**: Zero server uploads. Fast, private, and secure image manipulation directly in your browser.
- **Negative & Cyanotype Preview**: Instant switching between digital negative view and realistic Prussian blue (`#1C39BB`) developed print simulation.
- **Interactive Fine-Tuning**:
  - Positive tone curve adjustments (brightness, contrast, highlights, shadows).
  - Aspect ratio cropping (Square, 2:3, 4:3, 16:9, 1:2, Custom) with rule-of-thirds overlay.
  - 90° image rotation.
  - **Apply to All**: Bulk apply dialed-in tone adjustments to all loaded images in your project.
- **Print-Ready Sheet Generation (PDF)**:
  - Supports standard paper sizes: A3, A4, A5, A6.
  - Configurable grid layout (1, 2, 3, or 4 images per page) with margin controls.
  - Print resolution: 150, 300, 600, or 1200 DPI.
  - Individual photo auto-orientation to maximize film utilization.
  - Blank-tab preview for direct browser printing.
- **Individual Negative Export**:
  - Export as JPEG (with configurable 10–100% compression) or lossless PNG.
  - Saves directly to a chosen folder using the File System Access API or bundles into a ZIP archive.
- **Process Guides & Documentation (`/guide`)**:
  - Step-by-step development workflow (coating, drying, UV exposure, water rinse, oxidation with $H_2O_2$, toning).
  - Tested laboratory chemical formulations (Solution A, Solution B, 1:1 mix + 2% oxalic acid boost, small-batch workshop recipe).
  - Historical context (Sir John Herschel 1842, Anna Atkins' British Algae, blueprint origins, alternative photographic comparison).
- **SEO & Discoverability**:
  - Automated XML sitemap generation (`/sitemap.xml`) and robots.txt (`/robots.txt`).
  - Full static HTML prerendering for search engine crawlers and social share previews.

---

## Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com/) (Vue 3, TypeScript, Nitro static prerendering)
- **Content Engine**: [@nuxt/content v3](https://content.nuxt.com/) (Markdown collections with Zod schema validation)
- **SEO**: [@nuxtjs/seo](https://nuxtseo.com/) (automated sitemap, robots.txt, meta tags, schema.org)
- **UI Components**: [@nuxt/ui v4](https://ui.nuxt.com/) & [Tailwind CSS v4](https://tailwindcss.com/)
- **PDF & Archive Generation**: [jsPDF](https://github.com/parallax/jsPDF) & [JSZip](https://stuk.github.io/jszip/)
- **Package Manager & Runtime**: [Bun](https://bun.sh/)
- **Hosting**: [Cloudflare Pages](https://pages.cloudflare.com/) via GitHub Actions

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.1 or later)

### Installation

```bash
# Clone repository
git clone https://github.com/FelyCZ/cyanotype.git
cd cyanotype

# Install dependencies
bun install
```

### Development

```bash
# Start local development server on http://localhost:3000
bun run dev
```

### Build & Typecheck

```bash
# Run TypeScript verification
bun run typecheck

# Generate static production site to .output/public
bun run generate
```

---

## Deployment (Cloudflare Pages)

The project is deployed to Cloudflare Pages ([blueprinting.pages.dev](https://blueprinting.pages.dev)) using GitHub Actions:

1. **Preview Deployments**: Triggered on pushes to `master`. Builds and deploys a non-production preview deployment (`<hash>.blueprinting.pages.dev`).
2. **Production Deployments**: Triggered when a version tag (`vX.Y.Z`) is pushed. Deploys directly to the production domain (`blueprinting.pages.dev`).

---

## Author & License

Created by **Jakub Ferenčík** ([@FelyCZ](https://github.com/FelyCZ)).  
Open-source project licensed under the [MIT License](LICENSE).
