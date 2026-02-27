import * as cheerio from 'cheerio';
import { StrawClient, StrawClientOptions } from '../core/client';

export interface WebScrapeResult {
    title: string;
    description: string;
    text: string;
    links: { text: string; href: string }[];
    meta: Record<string, string>;
}

export class WebScraper {
    private client: StrawClient;

    constructor(options?: StrawClientOptions) {
        this.client = new StrawClient(options);
    }

    /**
     * Scrape a webpage and return structured data.
     * Extracts title, generic text, metadata, and all links.
     */
    public async scrape(url: string): Promise<WebScrapeResult> {
        const html = await this.client.getText(url);
        const $ = cheerio.load(html);

        const title = $('title').text().trim();
        let description = $('meta[name="description"]').attr('content') || '';
        
        if (!description) {
            description = $('meta[property="og:description"]').attr('content') || '';
        }

        const meta: Record<string, string> = {};
        $('meta').each((_, el) => {
            const name = $(el).attr('name') || $(el).attr('property');
            const content = $(el).attr('content');
            if (name && content) {
                meta[name] = content;
            }
        });

        const links: { text: string; href: string }[] = [];
        $('a').each((_, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            if (href && href.startsWith('http')) {
                links.push({ text, href });
            }
        });

        // Remove scripts and styles for cleaner text extraction
        $('script, style, noscript, iframe, svg').remove();
        const text = $('body').text().replace(/\s+/g, ' ').trim();

        return {
            title,
            description,
            text,
            links,
            meta
        };
    }
}
