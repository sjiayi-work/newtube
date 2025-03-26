import { pgTable, timestamp, uuid, text, uniqueIndex } from 'drizzle-orm/pg-core';

// create 'users' schema
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkId: text('clerk_id').unique().notNull(),   // User Id from Clerk
    name: text('name').notNull(),
    imageUrl: text('image_url').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => [uniqueIndex('clerk_id_index').on(table.clerkId)]);   // create index on 'clerk_id' column

// create 'categories' schema
export const categories = pgTable('categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').unique().notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => [uniqueIndex('name_idx').on(table.name)]);