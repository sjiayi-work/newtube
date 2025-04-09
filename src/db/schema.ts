import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, text, uniqueIndex, integer, pgEnum, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';

// NT-4: Create 'users' schema
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkId: text('clerk_id').unique().notNull(),   // User Id from Clerk
    name: text('name').notNull(),
    imageUrl: text('image_url').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => [uniqueIndex('clerk_id_index').on(table.clerkId)]);   // create index on 'clerk_id' column

// NT-10: Add user relations.
// NOTE: Not necessary needed, as `relations` is for database that does not support foreign key,
// and relations only take effect on application level, i.e: no changes detected when push to Neon.
// Keep it here for study purpose.
export const userRelations = relations(users, ({ many }) => ({
    videos: many(videos),
    videoViews: many(videoViews),
    videoReactions: many(videoReactions),
    subscriptions: many(subscriptions, {
        relationName: 'subscriptions_viewer_id_fkey'
    }),
    subscribers: many(subscriptions, {
        relationName: 'subscriptions_creator_id_fkey'
    })
}));

// NT-8: Create 'categories' schema
export const categories = pgTable('categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').unique().notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => [uniqueIndex('name_idx').on(table.name)]);

export const categoryRelations = relations(categories, ({ many }) => ({
    videos: many(videos)
}));

export const videoVisibility = pgEnum('video_visibility', ['private', 'public']);

// NT-10: Create 'videos' schema
export const videos = pgTable('videos', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    thumbnailUrl: text('thumbnail_url'),
    thumbnailKey: text('thumbnail_key'),
    previewUrl: text('preview_url'),
    previewKey: text('preview_key'),
    duration: integer('duration').default(0).notNull(),
    visibility: videoVisibility('visibility').default('private').notNull(),
    // Mux properties
    muxStatus: text('mux_status'),
    muxAssetId: text('mux_asset_id').unique(),
    muxUploadId: text('mux_upload_id').unique(),
    muxPlaybackId: text('mux_playback_id').unique(),
    muxTrackId: text('mux_track_id').unique(),
    muxTrackStatus: text('mux_track_status'),
    // Foreign keys
    userId: uuid('user_id').references(() => users.id, {
        onDelete: 'cascade'
    }).notNull(),
    categoryId: uuid('category_id').references(() => categories.id, {
        onDelete: 'set null'
    })
});

// Form schemas
export const videoInsertSchema = createInsertSchema(videos);
export const videoUpdateSchema = createUpdateSchema(videos);
export const videoSelectSchema = createSelectSchema(videos);

// NT-10: Create video relations, but not important
export const videoRelations = relations(videos, ({ one, many }) => ({
    user: one(users, {
        fields: [videos.userId],
        references: [users.id]
    }),
    category: one(categories, {
        fields: [videos.categoryId],
        references: [categories.id]
    }),
    views: many(videoViews),
    reactions: many(videoReactions)
}));

// NT-19: Create video_views table, relations and schemas
export const videoViews = pgTable('video_views', {
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade'}).notNull(),
    videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade'}).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (t) => [
    primaryKey({
        name: 'video_views_pk',
        columns: [t.userId, t.videoId]
    })
]);

export const videoViewRelations = relations(videoViews, ({ one }) => ({
    users: one(users, {
        fields: [videoViews.userId],
        references: [users.id],
    }),
    videos: one(videos, {
        fields: [videoViews.videoId],
        references: [videos.id]
    })
}));

export const videoViewSelectSchema = createSelectSchema(videoViews);
export const videoViewInsertSchema = createInsertSchema(videoViews);
export const videoViewUpdateSchema = createUpdateSchema(videoViews);

// NT-20: Create video_reactions table, relations and schemas
export const reactionType = pgEnum('reaction_type', ['like', 'dislike']);

export const videoReactions = pgTable('video_reactions', {
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade'}).notNull(),
    videoId: uuid('video_id').references(() => videos.id, { onDelete: 'cascade'}).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    type: reactionType('type').notNull()
}, (t) => [
    primaryKey({
        name: 'video_reactions_pk',
        columns: [t.userId, t.videoId]
    })
]);

export const videoReactionRelations = relations(videoReactions, ({ one }) => ({
    users: one(users, {
        fields: [videoReactions.userId],
        references: [users.id],
    }),
    videos: one(videos, {
        fields: [videoReactions.videoId],
        references: [videos.id]
    })
}));

export const videoReactionSelectSchema = createSelectSchema(videoReactions);
export const videoReactionInsertSchema = createInsertSchema(videoReactions);
export const videoReactionUpdateSchema = createUpdateSchema(videoReactions);

// NT-21: Create subscriptions table, relations
export const subscriptions = pgTable('subscriptions', {
    viewerId: uuid('viewer_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    creatorId: uuid('creator_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
    primaryKey({
        name: 'subscriptions_pk',
        columns: [t.viewerId, t.creatorId]
    })
]);

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
    viewerId: one(users, {
        fields: [subscriptions.viewerId],
        references: [users.id],
        relationName: 'subscriptions_viewer_id_fkey'
    }),
    creatorId: one(users, {
        fields: [subscriptions.creatorId],
        references: [users.id],
        relationName: 'subscriptions_creator_id_fkey'
    })
}));