import { eq, getTableColumns } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { comments, users } from '@/db/schema';
import { baseProcedure, createTRPCRouter, protectedProcedure } from '@/trpc/init';

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
        .input(z.object({ videoId: z.string().uuid() }))
        .query(async ({ input }) => {
            const { videoId } = input;
            
            const data = await db.select({
                                     ...getTableColumns(comments),
                                     user: users
                                 })
                                 .from(comments)
                                 .where(eq(comments.videoId, videoId))
                                 .innerJoin(users, eq(users.id, comments.userId));
            return data;
        })
});