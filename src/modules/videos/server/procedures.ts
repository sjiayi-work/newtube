import { TRPCError } from '@trpc/server';
import { and, eq, getTableColumns } from 'drizzle-orm';
import { UTApi } from 'uploadthing/server';
import { z } from 'zod';

import { db } from '@/db';
import { users, videos, videoUpdateSchema, videoViews } from '@/db/schema';
import { mux } from '@/lib/mux';
import { workflow } from '@/lib/workflow';
import { baseProcedure, createTRPCRouter, protectedProcedure } from '@/trpc/init';

export const videosRouter = createTRPCRouter({
    // NT-10: Create video database
    create: protectedProcedure.mutation(async ({ ctx }) => {
        const { id: userId } = ctx.user;
        
        const upload = await mux.video.uploads.create({
            new_asset_settings: {
                passthrough: userId,
                playback_policy: ['public'],
                input: [{
                    generated_subtitles: [{
                        language_code: 'en',
                        name: 'English'
                    }]
                }]
            },
            cors_origin: '*'    // TODO: In production, set to specific URL
        });
        
        const [video] = await db.insert(videos)
                                .values({
                                    userId,
                                    title: 'Untitled',
                                    muxStatus: 'waiting',
                                    muxUploadId: upload.id
                                })
                                .returning();
        return { 
            video, 
            url: upload.url
        };
    }),
    update: protectedProcedure.input(videoUpdateSchema).mutation(async ({ ctx, input }) => {
        const { id: userId } = ctx.user;
        
        if (!input.id) {
            throw new TRPCError({ code: 'BAD_REQUEST' });
        }
        
        const [updatedVideo] = await db.update(videos)
                                        .set({
                                            title: input.title,
                                            description: input.description,
                                            categoryId: input.categoryId,
                                            visibility: input.visibility,
                                            updatedAt: new Date()
                                        })
                                        .where(and(
                                            eq(videos.id, input.id), 
                                            eq(videos.userId, userId)
                                        ))
                                        .returning();
        if (!updatedVideo) {
            throw new TRPCError({ code: 'NOT_FOUND' });
        }
        
        return updatedVideo;
    }),
    remove: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
        const { id: userId } = ctx.user;
        const videoId = input.id;
        if (!videoId) {
            throw new TRPCError({ code: 'BAD_REQUEST' });
        }
        
        const [removedVideo] = await db.delete(videos)
                                        .where(and(
                                            eq(videos.id, videoId), 
                                            eq(videos.userId, userId)
                                        ))
                                        .returning();
        if (!removedVideo) {
            throw new TRPCError({ code: 'NOT_FOUND' });
        }
        
        return removedVideo;
    }),
    restoreThumbnail: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
        const { id: userId } = ctx.user;
        const videoId = input.id;
        
        const [existingVideo] = await db.select()
                                        .from(videos)
                                        .where(and(
                                            eq(videos.id, videoId),
                                            eq(videos.userId, userId)
                                        ));
        if (!existingVideo) {
            throw new TRPCError({ code: 'NOT_FOUND' });
        }
        
        // cleanup UploadThing
        if (existingVideo.thumbnailKey) {
            const utapi = new UTApi();
            // delete in UploadThing
            await utapi.deleteFiles(existingVideo.thumbnailKey);
            // reset in db
            await db.update(videos)
                    .set({
                        thumbnailKey: null,
                        thumbnailUrl: null
                    })
                    .where(and(
                        eq(videos.id, videoId),
                        eq(videos.userId, userId)
                    ));
        }
        
        if (!existingVideo.muxPlaybackId) {
            throw new TRPCError({ code: 'BAD_REQUEST' });
        }
        
        // upload thumbnail to UploadThing
        const tempThumbnailUrl = `https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.png`;
        const utapi = new UTApi();
        const uploadedThumbnail = await utapi.uploadFilesFromUrl(tempThumbnailUrl);
        if (!uploadedThumbnail.data) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        }
        
        const { key: thumbnailKey, url: thumbnailUrl } = uploadedThumbnail.data;
        
        const [updatedVideo] = await db.update(videos)
                                        .set({ thumbnailUrl, thumbnailKey })
                                        .where(and(
                                            eq(videos.id, input.id),
                                            eq(videos.userId, userId)
                                        ))
                                        .returning();
        return updatedVideo;
    }),
    // NT-17: Generate AI thumbnail by triggering Upstash background workflow
    generateThumbnail: protectedProcedure
        .input(z.object({ id: z.string().uuid(), prompt: z.string().min(10) }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user;
            
            const { workflowRunId } = await workflow.trigger({
                url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/thumbnail`,
                body: { 
                    userId, 
                    videoId: input.id, 
                    prompt: input.prompt
                }
            });
            
            return workflowRunId;
        }),
    // NT-16: Generate AI title by triggering Upstash background workflow
    generateTitle: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
        const { id: userId } = ctx.user;
        
        const { workflowRunId } = await workflow.trigger({
            url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/title`,
            body: { userId, videoId: input.id },
            retries: 3
        });
        
        return workflowRunId;
    }),
    // NT-16: Generate AI description by triggering Upstash background workflow
    generateDescription: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
        const { id: userId } = ctx.user;
        
        const { workflowRunId } = await workflow.trigger({
            url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/description`,
            body: { userId, videoId: input.id },
            retries: 3
        });
        
        return workflowRunId;
    }),
    // NT-18: Retrieve a video by joining to users table
    getOne: baseProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ input }) => {
            const [existingVideo] = await db.select({ 
                                                ...getTableColumns(videos),
                                                user: {
                                                    ...getTableColumns(users)
                                                },
                                                // NT-19: do a count
                                                viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id))
                                            })
                                            .from(videos)
                                            .innerJoin(users, eq(videos.userId, users.id))
                                            .where(eq(videos.id, input.id));
            
            if (!existingVideo) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }
            
            return existingVideo;
        })
});