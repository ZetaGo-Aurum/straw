# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] "Deep Metadata & Formats Engine" - 2026-02-27
- **Feat:** Integrated extracting `subscribers`, `likes`, and `comments` directly from YouTube's `ytInitialData` payload without external parsing overhead.
- **Feat:** Segregated `formats` array into three exact categorical bins: `video` (combined), `videoOnly`, and `audio` (audio-only), ensuring zero-ambiguity when downloading specific streams.

## [1.1.1] "Performance Patch" - 2026-02-27
- **Perf:** Re-engineered the YouTube scraper in Node.js and Python to use the `IOS` InnerTube API directly, injecting localized `visitorData` tokens to seamlessly bypass bot checks and cipher encryption. Video format lists are returned instantaneously for optimal downloading infrastructure.
- **Fix:** Fixed HTML parser blocking on high-volume deployed servers by upgrading to the direct `POST /youtubei/v1/player` endpoints.

## [1.1.0] - "Milk Tea" Release - 2026-02-27

### Changed
- Fixed Python `media.py` RegExp syntax causing import failures.
- Updated README.md with functional badges and version codename.
- Linked package.json to the correct Git metadata and License.
- Added comprehensive structured documentation inside `/docs` folder.

## [1.0.0] - 2026-02-27

### Added
- **Unified Monorepo Architecture**: Combined Node.js (TypeScript) and Python implementations into a single repository for maximum developer convenience.
- **Strawberry Core HTTP Client (`StrawClient`)**: Lightweight wrapper around `undici` (JS) and `httpx` (Python) featuring built-in exponential backoff retries, anti-CORS bypass, active User-Agent rotation, and strict TLS ignore.
- **WebScraper (`web`)**: Scrapes and parses titles, OpenGraph metadata, standard metadata, internal/external links, and semantic text content safely.
- **YouTubeScraper (`youtube`)**: High-performance, bloatware-free YouTube extractor that natively parses innerTube JSON for video formats, audio streams, and details (bypassing EU consent screens).
- **MediaScraper (`media`)**: Comprehensive media extractor that sniff pages for Images, Audio, Video, and Documents (.pdf, .doc, .mp4, .png, etc.).
- Comprehensive Unit Tests for both languages.
- NPM Publish pipeline configured.

### Security
- Verified code with `npm audit` achieving 0 vulnerabilities (100% Secure).
- Implemented robust anti-blocking configurations minimizing ban risks.
