import { serve } from '@upstash/workflow/nextjs';
import { and, eq } from 'drizzle-orm';
import { UTApi } from 'uploadthing/server';

import { db } from '@/db';
import { videos } from '@/db/schema';

interface InputType {
    userId: string;
    videoId: string;
    prompt: string;
}

interface ResultType {
    data: Array<{ url: string }>;
    error?: {
        code: string;
        message: string;
        type: string;
    };
}

export const { POST } = serve(
    async (context) => {
        const input = context.requestPayload as InputType;
        const { userId, videoId, prompt } = input;
        const utapi = new UTApi();
        
        // get video from database
        const existingVideo = await context.run('get-video', async () => {
            const data = await db.select()
                                 .from(videos)
                                 .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
            if (!data[0]) {
                throw new Error('Video not found');
            }
            
            return data[0];
        });
        
        // invoke AI to generate thumbnail
        // https://upstash.com/docs/workflow/basics/context#context-call
        // https://platform.openai.com/docs/api-reference/images/create
        // NOTE: This is not working until a paid OpenAI account is setup
        const { body } = await context.call<ResultType>('generate-thumbnail', {
            url: 'https://api.openai.com/v1/images/generations',
            method: 'POST',
            body: {
                prompt,
                n: 1,
                model: 'dall-e-3',
                size: '1792x1024'
            },
            headers: {
                authorization: `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        
        if (body.error) {
            throw new Error(body.error.message);
        }
        
        const tempThumbnailUrl = body.data[0].url;
        if (!tempThumbnailUrl) {
            throw new Error('Bad request');
        }
        
        // cleanup old thumbnail in uploadthing and database
        await context.run('cleanup-thumbnail', async () => {
            if (existingVideo.thumbnailKey) {
                await utapi.deleteFiles(existingVideo.thumbnailKey);
                await db
                    .update(videos)
                    .set({
                        thumbnailKey: null,
                        thumbnailUrl: null
                    })
                    .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
            }
        });
        
        // upload the AI generated image url to uploadthing
        const uploadedThumbnail = await context.run('upload-thumbnail', async () => {
            const { data } = await utapi.uploadFilesFromUrl(tempThumbnailUrl);
            
            if (!data) {
                throw new Error('Bad request');
            }
            
            return data;
        });
        
        await context.run('update-video', async () => {
            await db
                .update(videos)
                .set({
                    thumbnailKey: uploadedThumbnail.key,
                    thumbnailUrl: uploadedThumbnail.url
                })
                .where(and(
                    eq(videos.id, videoId),
                    eq(videos.userId, userId)
                ));
                
            console.log('Video thumbnail is updated');
        });
    }
);