CREATE TABLE `team_invitations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`invitee_id` integer NOT NULL,
	`invited_by_id` integer,
	`role` text DEFAULT 'member' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer NOT NULL,
	`responded_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invitee_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_invitations_pending_uq` ON `team_invitations` (`team_id`,`invitee_id`) WHERE "team_invitations"."status" = 'pending';--> statement-breakpoint
CREATE INDEX `team_invitations_invitee_idx` ON `team_invitations` (`invitee_id`,`status`);--> statement-breakpoint
CREATE TABLE `username_holds` (
	`username` text PRIMARY KEY NOT NULL,
	`profile_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `username_holds_expires_idx` ON `username_holds` (`expires_at`);--> statement-breakpoint
CREATE TABLE `collection_items` (
	`collection_id` integer NOT NULL,
	`shot_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`collection_id`, `shot_id`),
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shot_id`) REFERENCES `shots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `collection_items_shot_idx` ON `collection_items` (`shot_id`);--> statement-breakpoint
CREATE INDEX `collection_items_recent_idx` ON `collection_items` (`collection_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` integer NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`description` text,
	`is_private` integer DEFAULT false NOT NULL,
	`shots_count` integer DEFAULT 0 NOT NULL,
	`hidden_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "collections_name_len" CHECK(length("collections"."name") BETWEEN 1 AND 60),
	CONSTRAINT "collections_desc_len" CHECK("collections"."description" IS NULL OR length("collections"."description") <= 300),
	CONSTRAINT "collections_count_nonneg" CHECK("collections"."shots_count" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_owner_name_uq` ON `collections` (`owner_id`,`name_key`);--> statement-breakpoint
CREATE INDEX `collections_owner_idx` ON `collections` (`owner_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `comment_likes` (
	`profile_id` integer NOT NULL,
	`comment_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`profile_id`, `comment_id`),
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `comment_likes_comment_idx` ON `comment_likes` (`comment_id`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shot_id` integer NOT NULL,
	`author_id` integer NOT NULL,
	`parent_id` integer,
	`body` text NOT NULL,
	`likes_count` integer DEFAULT 0 NOT NULL,
	`edited_at` integer,
	`hidden_at` integer,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`shot_id`) REFERENCES `shots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "comments_body_len" CHECK("comments"."deleted_at" IS NOT NULL OR length("comments"."body") BETWEEN 1 AND 2000),
	CONSTRAINT "comments_likes_nonneg" CHECK("comments"."likes_count" >= 0)
);
--> statement-breakpoint
CREATE INDEX `comments_thread_idx` ON `comments` (`shot_id`,`parent_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `comments_author_idx` ON `comments` (`author_id`);--> statement-breakpoint
CREATE TABLE `follows` (
	`follower_id` integer NOT NULL,
	`followee_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`follower_id`, `followee_id`),
	FOREIGN KEY (`follower_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`followee_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "follows_not_self" CHECK("follows"."follower_id" <> "follows"."followee_id")
);
--> statement-breakpoint
CREATE INDEX `follows_followee_idx` ON `follows` (`followee_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `follows_follower_idx` ON `follows` (`follower_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `idempotency_keys` (
	`actor_profile_id` integer NOT NULL,
	`scope` text NOT NULL,
	`key` text NOT NULL,
	`status` integer NOT NULL,
	`result` text,
	`expires_at` integer NOT NULL,
	PRIMARY KEY(`actor_profile_id`, `scope`, `key`),
	FOREIGN KEY (`actor_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idempotency_expires_idx` ON `idempotency_keys` (`expires_at`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reporter_id` integer NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text NOT NULL,
	`note` text,
	`status` text DEFAULT 'open' NOT NULL,
	`resolved_by_id` integer,
	`resolved_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`reporter_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resolved_by_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "reports_note_len" CHECK("reports"."note" IS NULL OR length("reports"."note") <= 500)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reports_reporter_target_uq` ON `reports` (`reporter_id`,`target_type`,`target_id`);--> statement-breakpoint
CREATE INDEX `reports_queue_idx` ON `reports` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `reports_target_idx` ON `reports` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `companies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_profile_id` integer NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`website_url` text NOT NULL,
	`logo_media_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`logo_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "companies_name_len" CHECK(length("companies"."name") BETWEEN 1 AND 80)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `companies_owner_name_uq` ON `companies` (`owner_profile_id`,`name_key`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`poster_id` integer NOT NULL,
	`company_id` integer NOT NULL,
	`specialty_id` integer NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description_html` text NOT NULL,
	`description_text` text NOT NULL,
	`location` text,
	`workplace_type` text NOT NULL,
	`employment_type` text NOT NULL,
	`apply_url` text NOT NULL,
	`published_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`closed_at` integer,
	`hidden_at` integer,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`poster_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`specialty_id`) REFERENCES `specialties`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "jobs_title_len" CHECK(length("jobs"."title") BETWEEN 5 AND 100)
);
--> statement-breakpoint
CREATE INDEX `jobs_board_idx` ON `jobs` (`expires_at`,`published_at`);--> statement-breakpoint
CREATE INDEX `jobs_specialty_idx` ON `jobs` (`specialty_id`,`published_at`);--> statement-breakpoint
CREATE INDEX `jobs_poster_idx` ON `jobs` (`poster_id`,`published_at`);--> statement-breakpoint
CREATE TABLE `specialties` (
	`id` integer PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `specialties_slug_unique` ON `specialties` (`slug`);--> statement-breakpoint
ALTER TABLE `media` ADD `purpose` text DEFAULT 'seed' NOT NULL;--> statement-breakpoint
ALTER TABLE `media` ADD `provider_file_id` text;--> statement-breakpoint
ALTER TABLE `media` ADD `palette` text;--> statement-breakpoint
ALTER TABLE `media` ADD `failure_reason` text;--> statement-breakpoint
ALTER TABLE `profiles` ADD `username_changed_at` integer;--> statement-breakpoint
ALTER TABLE `profiles` ADD `intents` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
CREATE INDEX `likes_profile_recent_idx` ON `likes` (`profile_id`,`created_at`);