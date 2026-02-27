import { StrawClient, StrawClientOptions } from './core/client';
import { WebScraper, WebScrapeResult } from './scrapers/web';
import { YouTubeScraper, YouTubeResult, YouTubeFormats } from './scrapers/youtube';
import { MediaScraper, MediaScrapeResult } from './scrapers/media';

export type { StrawClientOptions };
export type { WebScrapeResult };
export type { YouTubeResult, YouTubeFormats };
export type { MediaScrapeResult };

export {
    StrawClient,
    WebScraper,
    YouTubeScraper,
    MediaScraper
};

// Default export wrapper
const straw = {
    client: (options?: StrawClientOptions) => new StrawClient(options),
    web: (options?: StrawClientOptions) => new WebScraper(options),
    youtube: (options?: StrawClientOptions) => new YouTubeScraper(options),
    media: (options?: StrawClientOptions) => new MediaScraper(options),
};

export default straw;
