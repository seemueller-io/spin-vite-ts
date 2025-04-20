// For AutoRouter documentation refer to https://itty.dev/itty-router/routers/autorouter
import { AutoRouter } from 'itty-router';
// import { readFileSync } from 'fs';
// import * as wasext from "@fermyon/wasi-ext/lib/fs";

let router = AutoRouter();

// make a bucket

const ASSETS = {
    async fetch(request: Request) {

        const originalUrl = new URL(request.url);

        if( originalUrl.pathname === "/" ) {
            originalUrl.pathname = "/static/index.html"
        } else {
            originalUrl.pathname = "/static".concat(originalUrl.pathname)
        }
        // originalUrl.host = "self";
        // originalUrl.port = '';


        const assetRequest = new Request(originalUrl.toString(), request);

        try {
            console.debug(`Forwarding request to: ${assetRequest.url}`);
            // const file = readFileSync(fullPath); // Read the file using Deno
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
        console.log("handleStaticAssets")
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
    .get('/hello/:name', ({ name }) => `Hello, ${name}!`)
    .get('*', async (r) => {
        // console.log({wasext});
        const { assetService } = createServerContext(r);
        return assetService.handleStaticAssets(r);
    });

//@ts-ignore
addEventListener('fetch', (event: FetchEvent) => {
    event.respondWith(router.fetch(event.request));
});
