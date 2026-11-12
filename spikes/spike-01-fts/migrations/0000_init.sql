CREATE TABLE `shots` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`tags` text,
	`likes` integer DEFAULT 0 NOT NULL,
	`published_at` integer NOT NULL
);
