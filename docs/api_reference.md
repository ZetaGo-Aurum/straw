# API Reference

This module exports the exact same interfaces across both JS and Python.

## `WebScraper`
Extracts high-level semantics from any standard webpage.

- `scrape(url: string)`: Returns the following schema:
  - `title`: The `<title>` of the page.
  - `description`: The meta-description or OG-description.
  - `text`: Every pure string in the `<body>` element perfectly separated by spaces (great for LLM RAGs).
  - `links`: Array of dictionaries containing `href` and `text` for every `<a>` tag.
  - `meta`: Key-value pair of all `<meta>` tags present on the page.

---

## `YouTubeScraper`
Extracts rich media from the YouTube Player Response JSON naturally, completely dodging rate-limit heavy JS scrapers like `ytdl-core`.

- `scrapeVideo(url: string)` / `scrape_video(url: str)`: Returns:
  - `title`, `author`, `description`, `views`, `durationSeconds`, `thumbnail`.
  - `formats`: An array of media formats containing `url`, `mimeType`, `quality`, `hasAudio`, and `hasVideo`. You can directly stream from these URLs or pass them to `ffmpeg`.

---

## `MediaScraper`
Extracts deeply embedded raw media files from web layers. Identifies raw paths from `<video>`, `<img>`, HTML `<source>` tags, and general deep URL sniffing.
- Extracted Extensions: `mp4, mp3, pdf, docx, png, jpg, webm, wav, ogg` and more. 

- `extractMedia(url: string)` / `extract_media(url: str)`: Returns:
  - `pageTitle`: Title of the scraped page.
  - `mediaLinks`: Array of absolute HTTP/HTTPS strings directly leading to files.

---

## `StrawClient`
The core engine. If you want to build custom scrapers, instantiate the base client!
- **Options / Config**:
  - `timeout`: Request timeout in milliseconds (JS) or seconds (Py). Default `10000` / `10`.
  - `retries`: Number of exponential backoff retry attempts. Default `3`.
  - `rotateUserAgent` / `rotate_user_agent`: `true` by default.
  - `proxy`: An optional HTTP/HTTPS proxy string.
