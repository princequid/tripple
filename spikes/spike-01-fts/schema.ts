import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
export const shots = sqliteTable('shots', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  tags: text('tags'),
  likes: integer('likes').notNull().default(0),
  publishedAt: integer('published_at').notNull(),
});
