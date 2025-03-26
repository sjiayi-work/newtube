import { createTRPCRouter } from '../init';
import { categoriesRouter } from '@/modules/categories/server/procedures';

// This file is copied from https://trpc.io/docs/client/react/server-components#2-create-a-trpc-router

export const appRouter = createTRPCRouter({
    categories: categoriesRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;