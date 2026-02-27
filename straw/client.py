import httpx
from typing import Optional, Dict, Any
from .helpers import get_random_user_agent, async_sleep

class StrawClient:
    def __init__(self, proxy: Optional[str] = None, timeout: int = 10, retries: int = 3, rotate_user_agent: bool = True):
        self.proxy = proxy
        self.timeout = timeout
        self.retries = retries
        self.rotate_user_agent = rotate_user_agent
        
        # We share the client across requests if possible, but for true stateless scraping,
        # we can spin up async clients per request or manage a session pool here.
        # httpx AsyncClient handles connection pooling out of the box.
        self._client = httpx.AsyncClient(
            proxy=self.proxy,
            timeout=self.timeout,
            verify=False,  # Ignore strict SSL to match JS version capability
            follow_redirects=True
        )

    async def request(self, method: str, url: str, **kwargs) -> httpx.Response:
        attempts = 0
        max_retries = max(1, self.retries)

        headers = kwargs.pop('headers', {})
        if self.rotate_user_agent and 'User-Agent' not in headers:
            headers['User-Agent'] = get_random_user_agent()
            
        if 'Accept' not in headers:
            headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
        if 'Accept-Language' not in headers:
            headers['Accept-Language'] = 'en-US,en;q=0.9'

        # Force HTTP/1.1 or HTTP/2 default connection properties via httpx
        
        while attempts < max_retries:
            try:
                response = await self._client.request(method, url, headers=headers, **kwargs)
                
                # Check rate limits
                if response.status_code in [429, 500, 502, 503, 504]:
                    raise httpx.HTTPStatusError(f"HTTP Error {response.status_code}", request=response.request, response=response)
                    
                return response
            except Exception as e:
                attempts += 1
                if attempts >= max_retries:
                    raise Exception(f"Failed to fetch {url} after {max_retries} attempts. Last error: {str(e)}")
                # Exponential backoff
                await async_sleep(1000 * (2 ** attempts))
                
        raise Exception("Unreachable")

    async def get_text(self, url: str, **kwargs) -> str:
        response = await self.request("GET", url, **kwargs)
        return response.text

    async def get_json(self, url: str, **kwargs) -> Any:
        response = await self.request("GET", url, **kwargs)
        return response.json()

    async def close(self):
        await self._client.aclose()
