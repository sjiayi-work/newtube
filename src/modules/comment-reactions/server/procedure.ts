import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { commentReactions } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';

export const commentReactionsRouter = createTRPCRouter({
    // NT-24: Set like to a comment
    like: protectedProcedure
        .input(z.object({ commentId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { commentId } = input;
            const { id: userId } = ctx.user;
            
            const [existingCommentReactionLike] = await db.select()
                                                        .from(commentReactions)
                                                        .where(and(
                                                            eq(commentReactions.commentId, commentId),
                                                            eq(commentReactions.userId, userId),
                                                            eq(commentReactions.type, 'like')
                                                        ));
            if (existingCommentReactionLike) {
                const [deletedVideoReaction] = await db.delete(commentReactions)
                                                        .where(and(
                                                            eq(commentReactions.userId, userId),
                                                            eq(commentReactions.commentId, commentId)
                                                        ))
                                                        .returning();
                return deletedVideoReaction;
            }
            
            const [createdCommentReaction] = await db.insert(commentReactions)
                                                    .values({ userId, commentId, type: 'like' })
                                                    .onConflictDoUpdate({
                                                        target: [commentReactions.userId, commentReactions.commentId],
                                                        set: {
                                                            type: 'like'
                                                        }
                                                    })
                                                    .returning();
            return createdCommentReaction;
        }),
    // NT-24: Set dislike to a comment
    dislike: protectedProcedure
        .input(z.object({ commentId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { commentId } = input;
            const { id: userId } = ctx.user;
            
            const [existingCommentReactionDislike] = await db.select()
                                                            .from(commentReactions)
                                                            .where(and(
                                                                eq(commentReactions.commentId, commentId),
                                                                eq(commentReactions.userId, userId),
                                                                eq(commentReactions.type, 'dislike')
                                                            ));
            if (existingCommentReactionDislike) {
                const [deletedCommentReaction] = await db.delete(commentReactions)
                                                        .where(and(
                                                            eq(commentReactions.userId, userId),
                                                            eq(commentReactions.commentId, commentId)
                                                        ))
                                                        .returning();
                return deletedCommentReaction;
            }
            
            const [createdCommentReaction] = await db.insert(commentReactions)
                                                    .values({ userId, commentId, type: 'dislike' })
                                                    .onConflictDoUpdate({
                                                        target: [commentReactions.userId, commentReactions.commentId],
                                                        set: {
                                                            type: 'dislike'
                                                        }
                                                    })
                                                    .returning();
            return createdCommentReaction;
        })
});