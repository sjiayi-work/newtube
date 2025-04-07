import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '@/trpc/init';
import { appRouter } from '@/trpc/routers/_app';

/**
 * This file is copied from:
 * {@link https://trpc.io/docs/client/react/server-components#2-create-a-trpc-router}
 */

const handler = (req: Request) =>
    fetchRequestHandler({
        endpoint: '/api/trpc',
        req,
        router: appRouter,
        createContext: createTRPCContext,
    });
export { handler as GET, handler as POST };