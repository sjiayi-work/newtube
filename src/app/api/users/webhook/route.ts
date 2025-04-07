import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users } from '@/db/schema';

/**
 * NT-5: Create the endpoint.
 * NOTE: This file is adapted from:
 * {@link https://clerk.com/docs/webhooks/sync-data#create-the-endpoint}
 * 
 * @param req - The incoming HTTP request
 * @returns HTTP response
 */
export async function POST(req: Request) {
    const SIGNING_SECRET = process.env.CLERK_SIGNING_SECRET;
    
    if (!SIGNING_SECRET) {
        throw new Error('Error: Please add CLERK_SIGNING_SECRET from Clerk Dashboard to .env');
    }
    
    // Create new Svix instance with secret
    const wh = new Webhook(SIGNING_SECRET);
    
    // Get headers
    const headerPayload = await headers();
    const svixId = headerPayload.get('svix-id');
    const svixTimestamp = headerPayload.get('svix-timestamp');
    const svixSignature = headerPayload.get('svix-signature');
    
    // If there are no headers, error out
    if (!svixId || !svixTimestamp || !svixSignature) {
        return new Response('Error: Missing Svix headers', {
            status: 400,
        });
    }

    // Get body
    const payload = await req.json();
    const body = JSON.stringify(payload);
    
    let evt: WebhookEvent;
    
    // Verify payload with headers
    try {
        evt = wh.verify(body, {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('Error: Could not verify webhook:', err);
        return new Response('Error: Verification error', {
            status: 400,
        });
    }
    
    // Do something with payload
    // For this guide, log payload to console
    const data = evt.data;
    const eventType = evt.type;
    
    if (eventType === 'user.created') {
        const data = evt.data;
        
        await db.insert(users).values({
            clerkId: data.id,
            name: `${data.first_name} ${data.last_name}`,
            imageUrl: data.image_url,
        });
    }
    
    if (eventType === 'user.deleted') {
        if (!data.id) {
            return new Response('Missing user id', { status: 400 });
        }
        
        await db.delete(users).where(eq(users.clerkId, data.id));
    }
    
    if (eventType === 'user.updated') {
        const data = evt.data;
        
        await db.update(users).set({
            name: `${data.first_name} ${data.last_name}`,
            imageUrl: data.image_url
        }).where(eq(users.clerkId, data.id));
    }
    
    return new Response('Webhook received', { status: 200 });
}