import { createTRPCRouter } from '../init';
import { studiosRouter } from '@/modules/studio/server/procedures';
import { categoriesRouter } from '@/modules/categories/server/procedures';
import { videosRouter } from '@/modules/videos/server/procedures';
import { videoViewsRouter } from '@/modules/video-views/server/procedure';
import { videoReactionsRouter } from '@/modules/video-reactions/server/procedure';
import { subscriptionsRouter } from '@/modules/subscriptions/server/procedure';
import { commentsRouter } from '@/modules/comments/server/procedure';
import { commentReactionsRouter } from '@/modules/comment-reactions/server/procedure';

/**
 * NT-7: This file is adapted from 
 * {@link https://trpc.io/docs/client/react/server-components#2-create-a-trpc-router}
 */

export const appRouter = createTRPCRouter({
    categories: categoriesRouter,
    studios: studiosRouter,
    videos: videosRouter,
    videoViews: videoViewsRouter,
    videoReactions: videoReactionsRouter,
    subscriptions: subscriptionsRouter,
    comments: commentsRouter,
    commentReactions: commentReactionsRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;