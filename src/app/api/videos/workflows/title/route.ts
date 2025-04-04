import { serve } from '@upstash/workflow/nextjs';
import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { videos } from '@/db/schema';

interface InputType {
    userId: string;
    videoId: string;
}

interface OllamaMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
  
interface OllamaResponse {
    model: string;
    created_at: string; // ISO 8601 timestamp
    message: OllamaMessage;
    done: boolean;
    total_duration?: number; // in nanoseconds
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

interface OllamaErrorResponse {
    error: string;
}

interface ResultType {
    status: number;
    body: OllamaResponse | OllamaErrorResponse;
}

const TITLE_SYSTEM_PROMPT = `Your task is to generate an SEO-focused title for a YouTube video based on its transcript. Please follow these guidelines:
- Be concise but descriptive, using relevant keywords to improve discoverability.
- Highlight the most compelling or unique aspect of the video content.
- Avoid jargon or overly complex language unless it directly supports searchability.
- Use action-oriented phrasing or clear value propositions where applicable.
- Ensure the title is 3-8 words long and no more than 100 characters.
- ONLY return the title as plain text. Do not add quotes or any additional formatting.`;

export const { POST } = serve(
    async(context) => {
        const input = context.requestPayload as InputType;
        const { userId, videoId } = input;
        
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
        
        // get the transcript from Mux
        // https://www.mux.com/docs/guides/add-autogenerated-captions-and-use-transcripts#retrieve-a-transcript
        const transcript = await context.run('get-transcript', async () => {
            const trackUrl = `https://stream.mux.com/${existingVideo.muxPlaybackId}/text/${existingVideo.muxTrackId}.txt`;
            const response = await fetch(trackUrl);
            const text = response.text();
            if (!text) {
                throw new Error('Bad request');
            }
            
            return text;
        });
        
        // invoke AI to generate title
        // https://upstash.com/docs/workflow/basics/context#context-call
        // https://github.com/ollama/ollama/blob/main/docs/api.md#generate-a-chat-completion
        const { body, status } = await context.call<ResultType>('call-ollama', {
            url: process.env.AI_CHAT_COMPLETION_URL!,
            method: 'POST',
            body: {
                model: process.env.AI_MODEL,
                messages: [{
                    role: 'system',
                    content: TITLE_SYSTEM_PROMPT
                }, {
                    role: 'user',
                    content: transcript
                }],
                stream: false
            }
        });
        
        // Type-safe error handling
        if (status !== 200) {
            const errorMessage = 'error' in body && typeof body.error === 'string' ? body.error : `API request failed with status ${status}`;
            throw new Error(errorMessage);
        }
        
        const title = body.message.content;
        if (!title) {
            throw new Error('Bad request');
        }
        
        await context.run('update-video', async () => {
            await db.update(videos)
                    .set({ title: title || existingVideo.title })
                    .where(and(
                        eq(videos.id, videoId),
                        eq(videos.userId, userId)
                    ));
                    
            console.log('Title updated');
        });
    }
);