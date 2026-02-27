# Getting Started with Straw

Straw perfectly unifies JavaScript/TypeScript and Python by providing exactly the same class patterns across both languages.

## Installation

### Node.js Setup
Install the core scraper using npm:
```bash
npm install @zetagoaurum-dev/straw
```
Straw relies on `undici` and `cheerio` under the hood. For TypeScript projects, types are included right out of the box!

### Python Setup
Currently, `straw-py` is intended to be cloned or included directly alongside your code, though you can bundle it as a module easily. Ensure these dependencies are installed:
```bash
pip install httpx beautifulsoup4 lxml
```

## Basic Scraping
Both versions initialize scraper modules out of the box. The base scraper client (`StrawClient`) comes configured with anti-blocking headers and User-Agent rotation. You don't need to write custom rotation logic!

**TypeScript Example**:
```ts
import straw from '@zetagoaurum-dev/straw';

const web = straw.web();
const dataset = await web.scrape('https://wikipedia.org');
```

**Python Example**:
```py
import asyncio
from straw import WebScraper

async def run():
    web = WebScraper()
    dataset = await web.scrape('https://wikipedia.org')
    await web.client.close()

asyncio.run(run())
```
