import { and, count, desc, eq, getTableColumns, lt, or } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { comments, users } from '@/db/schema';
import { baseProcedure, createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { TRPCError } from '@trpc/server';

export const commentsRouter = createTRPCRouter({
    // NT-22: Create comment
    create: protectedProcedure
        .input(z.object({
            videoId: z.string().uuid(),
            value: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            const { videoId, value } = input;
            const { id: userId } = ctx.user;
            
            const [createdComment] = await db.insert(comments).values({ userId, videoId, value }).returning();
            return createdComment;
        }),
    // NT-22: List video comments
    getMany: baseProcedure
        .input(z.object({ 
            videoId: z.string().uuid(),
            cursor: z.object({
                id: z.string().uuid(),
                updatedAt: z.date()
            }).nullish(),
            limit: z.number().min(1).max(100)
        }))
        .query(async ({ input }) => {
            const { videoId, cursor, limit } = input;
            
            const [totalData, data] = await Promise.all([
                db.select({ count: count() }).from(comments).where(eq(comments.videoId, videoId)),
                db.select({
                    ...getTableColumns(comments),
                    user: users
                })
                .from(comments)
                .where(and(
                    eq(comments.videoId, videoId), 
                    cursor 
                    ? or(
                        lt(comments.updatedAt, cursor.updatedAt), 
                        and(
                            eq(comments.updatedAt, cursor.updatedAt),
                            lt(comments.id, cursor.id)
                        )
                    ) : undefined
                ))
                .innerJoin(users, eq(users.id, comments.userId))
                .orderBy(desc(comments.updatedAt), desc(comments.id))
                .limit(limit + 1)
            ]);
            
            const hasMore = data.length > limit;

            // remove the last item if there is more data
            const items = hasMore ? data.slice(0, -1) : data;
            // set the next cursor to the last item if there is more data
            const lastItem = items[items.length - 1];
            const nextCursor = hasMore ? {
                id: lastItem.id,
                updatedAt: lastItem.updatedAt
            } : null;
            
            return { items, nextCursor, totalCount: totalData[0].count };
        }),
    // NT-23: Delete a comment
    remove: protectedProcedure
        .input(z.object({
            id: z.string().uuid()
        }))
        .mutation(async ({ ctx, input }) => {
            const { id } = input;
            const { id: userId } = ctx.user;
            
            const [deletedComment] = await db.delete(comments)
                                             .where(and(
                                                eq(comments.id, id),
                                                eq(comments.userId, userId)
                                             ))
                                             .returning();
            if (!deletedComment) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }
            
            return deletedComment;
        })
});