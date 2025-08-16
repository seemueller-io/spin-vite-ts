// For AutoRouter documentation refer to https://itty.dev/itty-router/routers/autorouter
import { AutoRouter, error } from 'itty-router';

const router = AutoRouter();

/**
 * Handles incoming requests, serving static assets by mapping public paths
 * to internal static file paths and proxying the request to a private endpoint.
 *
 * - Maps the root path ("/") to "/static/index.html".
 * - Prefixes all other paths with "/static".
 * - Forwards the modified request to the internal host "static.spin.internal".
 * - Returns a 404 response if fetching the asset from the internal host fails.
 */
const ASSETS = {
    /**
     * Fetches the requested static asset from the internal endpoint.
     *
     * @param {Request} request - The incoming Fetch API Request object.
     * @returns {Promise<Response>} A Promise that resolves with the Response for the requested asset,
     *                              or a 404 Response if the asset is not found or an error occurs.
     */
    async fetch(request: Request): Promise<Response> {
        // Serialize incoming request URL
        const originalUrl = new URL(request.url);
        const url = new URL(request.url);

        // Handle default entrypoint or prefix other paths with /static
        if (url.pathname === "/") {
            url.pathname = "/static/index.html";
        } else {
            // Ensure path starts with '/' before concatenating to avoid double slashes
            url.pathname = `/static${url.pathname}`;
        }

        // Update incoming request target to the private internal endpoint
        url.host = "static.spin.internal";

        // Construct a new request from the updated URL and the original request details
        const assetRequest = new Request(url.toString(), request);

        try {
            console.debug(`Forwarding request to: ${assetRequest.url}`);
            // Proxy the request result from the private endpoint
            return fetch(assetRequest);
        } catch (error) {
            // Log the error with the original requested path
            console.error(`Error reading asset from path ${originalUrl.pathname}:`, error);
            return new Response('Asset not found on disk', { status: 404 });
        }
    }
};
/**
 * Environment configuration object holding external dependencies like the ASSETS binding.
 */
const env = {
    ASSETS,
}

/**
 * Type definition for the environment configuration object.
 * Ensures type safety when injecting the environment into services.
 */
type Env = typeof env;

/**
 * Service responsible for fetching and serving static assets.
 * It uses the environment configuration to access the underlying asset fetching logic.
 */
class AssetService {
    // Private field to hold the environment configuration.
    #env: Env;

    /**
     * Constructs a new AssetService instance.
     * @param {Env} env - The environment configuration object containing dependencies.
     */
    constructor(env: Env) {
        this.#env = env;
    }

    /**
     * Handles an incoming Request by attempting to fetch the corresponding static asset.
     * It delegates the actual fetching to the configured ASSETS handler in the environment.
     * @param {Request} request - The incoming Fetch API Request object.
     * @returns {Promise<Response>} A Promise that resolves with the Response for the static asset,
     *                              or a 404 Response if an error occurs during fetching.
     */
    async handleStaticAssets(request: Request): Promise<Response> {
        try {
            console.debug(`Attempting: AssetService.handleStaticAssets(${request.url})`);
            // Delegate fetching to the ASSETS handler provided in the environment.
            return this.#env.ASSETS.fetch(request);
        } catch (error) {
            console.error('Error serving static asset:', error);
            // Return a 404 response if the asset fetching fails.
            return new Response('Asset not found', { status: 404 });
        }
    }
}

/**
 * Creates a context object for handling an incoming request.
 * This context typically includes instances of services initialized with the environment.
 * @param {Request} r - The incoming Fetch API Request object.
 * @returns {object} An object containing service instances, e.g., { assetService }.
 */
const createServerContext = (r: Request) => ({
    assetService: new AssetService(env) // Initialize AssetService with the global environment.
});


// Assuming 'router' is an instance from a routing library (e.g., Itty Router).
// This configuration sets up a route handler for all GET requests.
router
    .get('*', async (r) => {
        // Create a server context for the request.
        const { assetService } = createServerContext(r);
        // Use the AssetService from the context to handle the static asset request.
        return assetService.handleStaticAssets(r);
    });


/**
 * Standard event listener for incoming requests.
 * It intercepts the 'fetch' event and delegates request handling to the configured router.
 * @param {FetchEvent} event - The incoming FetchEvent.
 */
// @ts-ignore - runtime event handler
addEventListener('fetch', (event: FetchEvent) => {
    // Respond to the request using the router's fetch handler.
    event.respondWith(router.fetch(event.request).catch(error));
});
