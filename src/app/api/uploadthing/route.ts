import { createRouteHandler } from 'uploadthing/next';

import { ourFileRouter } from './core';

/**
 * NOTE: This file is copied from:
 * https://docs.uploadthing.com/getting-started/appdir#create-a-next-js-api-route-using-the-file-router
 */

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
    router: ourFileRouter,

    // Apply an (optional) custom config:
    // config: { ... },
});
