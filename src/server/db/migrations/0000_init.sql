CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `rate_limit` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rate_limit_key_unique` ON `rate_limit` (`key`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `content_blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shot_id` integer NOT NULL,
	`position` integer NOT NULL,
	`type` text NOT NULL,
	`media_id` text,
	`text_body` text,
	`alt` text,
	`is_full_width` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`shot_id`) REFERENCES `shots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "content_blocks_shape" CHECK(("content_blocks"."type" = 'image' AND "content_blocks"."media_id" IS NOT NULL) OR ("content_blocks"."type" = 'text' AND "content_blocks"."text_body" IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_blocks_shot_pos_uq` ON `content_blocks` (`shot_id`,`position`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_profile_id` integer,
	`kind` text DEFAULT 'image' NOT NULL,
	`storage_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`bytes` integer NOT NULL,
	`dominant_color` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_storage_key_unique` ON `media` (`storage_key`);--> statement-breakpoint
CREATE INDEX `media_owner_idx` ON `media` (`owner_profile_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`kind` text DEFAULT 'individual' NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`headline` text,
	`bio` text,
	`location` text,
	`website_url` text,
	`public_email` text,
	`avatar_media_id` text,
	`skills` text DEFAULT '[]' NOT NULL,
	`languages` text DEFAULT '[]' NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`is_featured_studio` integer DEFAULT false NOT NULL,
	`shots_count` integer DEFAULT 0 NOT NULL,
	`likes_received_count` integer DEFAULT 0 NOT NULL,
	`followers_count` integer DEFAULT 0 NOT NULL,
	`following_count` integer DEFAULT 0 NOT NULL,
	`suspended_at` integer,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`avatar_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "profiles_counters_nonneg" CHECK("profiles"."shots_count" >= 0 AND "profiles"."likes_received_count" >= 0 AND "profiles"."followers_count" >= 0 AND "profiles"."following_count" >= 0),
	CONSTRAINT "profiles_username_lower" CHECK("profiles"."username" = lower("profiles"."username")),
	CONSTRAINT "profiles_team_no_user" CHECK("profiles"."kind" = 'individual' OR "profiles"."user_id" IS NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_user_id_unique` ON `profiles` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_username_unique` ON `profiles` (`username`);--> statement-breakpoint
CREATE TABLE `shot_colors` (
	`shot_id` integer NOT NULL,
	`position` integer NOT NULL,
	`hex` text NOT NULL,
	`lab_l` real NOT NULL,
	`lab_a` real NOT NULL,
	`lab_b` real NOT NULL,
	PRIMARY KEY(`shot_id`, `position`),
	FOREIGN KEY (`shot_id`) REFERENCES `shots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shot_tags` (
	`shot_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`shot_id`, `tag_id`),
	FOREIGN KEY (`shot_id`) REFERENCES `shots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `shot_tags_tag_idx` ON `shot_tags` (`tag_id`,`shot_id`);--> statement-breakpoint
CREATE TABLE `shots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`author_id` integer NOT NULL,
	`team_id` integer,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`category_id` integer NOT NULL,
	`cover_media_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`comments_disabled` integer DEFAULT false NOT NULL,
	`likes_count` integer DEFAULT 0 NOT NULL,
	`saves_count` integer DEFAULT 0 NOT NULL,
	`comments_count` integer DEFAULT 0 NOT NULL,
	`views_count` integer DEFAULT 0 NOT NULL,
	`popularity_score` real DEFAULT 0 NOT NULL,
	`search_tags` text DEFAULT '' NOT NULL,
	`search_author` text DEFAULT '' NOT NULL,
	`hidden_at` integer,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "shots_counters_nonneg" CHECK("shots"."likes_count" >= 0 AND "shots"."saves_count" >= 0 AND "shots"."comments_count" >= 0 AND "shots"."views_count" >= 0),
	CONSTRAINT "shots_title_len" CHECK(length("shots"."title") BETWEEN 1 AND 100),
	CONSTRAINT "shots_published_has_date" CHECK("shots"."status" = 'draft' OR "shots"."published_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX `shots_recent_idx` ON `shots` (`status`,`published_at`,`id`);--> statement-breakpoint
CREATE INDEX `shots_popular_idx` ON `shots` (`status`,`popularity_score`);--> statement-breakpoint
CREATE INDEX `shots_cat_recent_idx` ON `shots` (`category_id`,`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `shots_cat_popular_idx` ON `shots` (`category_id`,`status`,`popularity_score`);--> statement-breakpoint
CREATE INDEX `shots_author_idx` ON `shots` (`author_id`,`published_at`);--> statement-breakpoint
CREATE INDEX `shots_team_idx` ON `shots` (`team_id`,`published_at`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`shots_count` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "tags_count_nonneg" CHECK("tags"."shots_count" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);--> statement-breakpoint
CREATE TABLE `team_memberships` (
	`team_id` integer NOT NULL,
	`member_id` integer NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`team_id`, `member_id`),
	FOREIGN KEY (`team_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `team_memberships_member_idx` ON `team_memberships` (`member_id`);--> statement-breakpoint
CREATE TABLE `user_social_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`profile_id` integer NOT NULL,
	`platform` text NOT NULL,
	`url` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_links_profile_platform_uq` ON `user_social_links` (`profile_id`,`platform`);--> statement-breakpoint
CREATE TABLE `likes` (
	`profile_id` integer NOT NULL,
	`shot_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`profile_id`, `shot_id`),
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shot_id`) REFERENCES `shots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `likes_shot_idx` ON `likes` (`shot_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `app_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `app_rate_limits_expires_idx` ON `app_rate_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `moderation_actions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_profile_id` integer,
	`actor_label` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`action` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`actor_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "moderation_reason_len" CHECK(length("moderation_actions"."reason") >= 10)
);
--> statement-breakpoint
CREATE INDEX `moderation_target_idx` ON `moderation_actions` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `shot_view_daily` (
	`shot_id` integer NOT NULL,
	`day` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`shot_id`, `day`),
	FOREIGN KEY (`shot_id`) REFERENCES `shots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `view_dedup` (
	`viewer_key` text NOT NULL,
	`shot_id` integer NOT NULL,
	`day` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`viewer_key`, `shot_id`, `day`),
	FOREIGN KEY (`shot_id`) REFERENCES `shots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `view_dedup_created_idx` ON `view_dedup` (`created_at`);