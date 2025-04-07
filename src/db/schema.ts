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
    videoViews: many(videoViews)
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
    views: many(videoViews)
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