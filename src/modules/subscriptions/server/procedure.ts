import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';

export const subscriptionsRouter = createTRPCRouter({
    // NT-21: Create a subscription
    create: protectedProcedure
        .input(z.object({ userId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { userId } = input;
            
            if (userId === ctx.user.id) {
                // creator cannot subscribe to own videos
                throw new TRPCError({ code: 'BAD_REQUEST' });
            }
            
            const [createdSubscription] = await db.insert(subscriptions)
                                            .values({ viewerId: ctx.user.id, creatorId: userId })
                                            .returning();
            return createdSubscription;
        }),
    // NT-21: Delete a subsscription
    remove: protectedProcedure
        .input(z.object({ userId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { userId } = input;
            
            if (userId === ctx.user.id) {
                // creator cannot subscribe to own videos
                throw new TRPCError({ code: 'BAD_REQUEST' });
            }
            
            const [deletedSubscription] = await db.delete(subscriptions)
                                                    .where(and(
                                                        eq(subscriptions.viewerId, ctx.user.id),
                                                        eq(subscriptions.creatorId, userId)
                                                    ))
                                                    .returning();
            return deletedSubscription;
        }),
});