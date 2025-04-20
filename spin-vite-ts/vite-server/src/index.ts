// For AutoRouter documentation refer to https://itty.dev/itty-router/routers/autorouter
import { AutoRouter } from 'itty-router';

const router = AutoRouter();

const ASSETS = {
    async fetch(request: Request) {

        const originalUrl = new URL(request.url);

        if( originalUrl.pathname === "/" ) {
            originalUrl.pathname = "/static/index.html"
        } else {
            originalUrl.pathname = "/static".concat(originalUrl.pathname)
        }
        originalUrl.host = "static.spin.internal";
        // originalUrl.port = '';


        const assetRequest = new Request(originalUrl.toString(), request);

        try {
            console.debug(`Forwarding request to: ${assetRequest.url}`);

            return fetch(assetRequest)
        } catch (error) {

            console.error(`Error reading asset from path ${originalUrl.toString()}:`, error);
            return new Response('Asset not found on disk', {status: 404});
        }
    }
};

const env = {
    ASSETS,
}

type Env = typeof env;

class AssetService {
    #env
    constructor(env: Env) {
        this.#env = env;
    }

    async handleStaticAssets(request: Request) {
        try {
            return this.#env.ASSETS.fetch(request);
            // Handle asset fetching logic
        } catch (error) {
            console.error('Error serving static asset:', error);
            return new Response('Asset not found', { status: 404 });
        }
    }

}

const createServerContext = (r: Request) => ({
    assetService: new AssetService(env)
});


// Route ordering matters, the first route that matches will be used
// Any route that does not return will be treated as a middleware
// Any unmatched route will return a 404
router
    .get('*', async (r) => {
        // console.log({wasext});
        const { assetService } = createServerContext(r);
        return assetService.handleStaticAssets(r);
    });

// @ts-ignore - runtime event handler
addEventListener('fetch', (event: FetchEvent) => {
    event.respondWith(router.fetch(event.request));
});
