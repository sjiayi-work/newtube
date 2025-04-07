import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * NT-3: Add Clerk middleware.
 * NOTE: This file is adapted from 
 * @link https://clerk.com/docs/quickstarts/nextjs#add-clerk-middleware-to-your-app
 */

// protect these routes
const isProtectedRoute = createRouteMatcher(["/studio(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};