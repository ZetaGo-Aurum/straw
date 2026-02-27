import { fetch, RequestInit, Response, Agent } from 'undici';
import { getRandomUserAgent, sleep } from '../utils/helpers';

export interface StrawClientOptions {
    proxy?: string;
    timeout?: number;
    retries?: number;
    rotateUserAgent?: boolean;
}

export class StrawClient {
    private options: StrawClientOptions;
    private dispatcher: Agent;

    constructor(options: StrawClientOptions = {}) {
        this.options = {
            timeout: 10000,
            retries: 3,
            rotateUserAgent: true,
            ...options
        };
        
        this.dispatcher = new Agent({
            connect: {
                rejectUnauthorized: false
            }
        });
    }

    /**
     * Fetch a URL with built-in retries, timeout, and User-Agent rotation.
     */
    public async request(url: string, init?: RequestInit): Promise<Response> {
        let attempts = 0;
        const maxRetries = this.options.retries || 1;

        while (attempts < maxRetries) {
            try {
                const headers = new Headers(init?.headers as any);
                
                if (this.options.rotateUserAgent && !headers.has('User-Agent')) {
                    headers.set('User-Agent', getRandomUserAgent());
                }

                // Default headers to masquerade as a normal browser
                if (!headers.has('Accept')) {
                    headers.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7');
                }
                if (!headers.has('Accept-Language')) {
                    headers.set('Accept-Language', 'en-US,en;q=0.9');
                }

                // Setup AbortController for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

                const response = await fetch(url, {
                    ...init,
                    headers,
                    signal: controller.signal as RequestInit['signal'],
                    dispatcher: this.options.proxy ? undefined : this.dispatcher
                });

                clearTimeout(timeoutId);

                // If rate limited or standard server error, retry
                if ([429, 500, 502, 503, 504].includes(response.status)) {
                    throw new Error(`HTTP Error ${response.status}`);
                }

                return response;
            } catch (error: any) {
                attempts++;
                if (attempts >= maxRetries) {
                    const cause = error.cause ? String(error.cause) : 'No cause provided';
                    throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts. Last error: ${error.message} - Cause: ${cause}`);
                }
                // Exponential backoff
                await sleep(1000 * Math.pow(2, attempts));
            }
        }
        throw new Error('Unreachable');
    }

    public async getText(url: string, init?: RequestInit): Promise<string> {
        const response = await this.request(url, init);
        return await response.text();
    }

    public async getJson<T>(url: string, init?: RequestInit): Promise<T> {
        const response = await this.request(url, init);
        return await response.json() as T;
    }
}
