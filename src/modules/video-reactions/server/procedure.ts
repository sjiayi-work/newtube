import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { videoReactions } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';

export const videoReactionsRouter = createTRPCRouter({
    // NT-20: Set like to a video
    like: protectedProcedure
        .input(z.object({ videoId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { videoId } = input;
            const { id: userId } = ctx.user;
            
            const [existingVideoReactionLike] = await db.select()
                                                        .from(videoReactions)
                                                        .where(and(
                                                            eq(videoReactions.videoId, videoId),
                                                            eq(videoReactions.userId, userId),
                                                            eq(videoReactions.type, 'like')
                                                        ));
            if (existingVideoReactionLike) {
                const [deletedVideoReaction] = await db.delete(videoReactions)
                                                        .where(and(
                                                            eq(videoReactions.userId, userId),
                                                            eq(videoReactions.videoId, videoId)
                                                        ))
                                                        .returning();
                return deletedVideoReaction;
            }
            
            const [createdVideoReaction] = await db.insert(videoReactions)
                                                    .values({ userId, videoId, type: 'like' })
                                                    .onConflictDoUpdate({
                                                        target: [videoReactions.userId, videoReactions.videoId],
                                                        set: {
                                                            type: 'like'
                                                        }
                                                    })
                                                    .returning();
            return createdVideoReaction;
        }),
    // NT-20: Set dislike to a video
    dislike: protectedProcedure
        .input(z.object({ videoId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { videoId } = input;
            const { id: userId } = ctx.user;
            
            const [existingVideoReactionDislike] = await db.select()
                                                            .from(videoReactions)
                                                            .where(and(
                                                                eq(videoReactions.videoId, videoId),
                                                                eq(videoReactions.userId, userId),
                                                                eq(videoReactions.type, 'dislike')
                                                            ));
            if (existingVideoReactionDislike) {
                const [deletedVideoReaction] = await db.delete(videoReactions)
                                                        .where(and(
                                                            eq(videoReactions.userId, userId),
                                                            eq(videoReactions.videoId, videoId)
                                                        ))
                                                        .returning();
                return deletedVideoReaction;
            }
            
            const [createdVideoReaction] = await db.insert(videoReactions)
                                                    .values({ userId, videoId, type: 'dislike' })
                                                    .onConflictDoUpdate({
                                                        target: [videoReactions.userId, videoReactions.videoId],
                                                        set: {
                                                            type: 'dislike'
                                                        }
                                                    })
                                                    .returning();
            return createdVideoReaction;
        })
});