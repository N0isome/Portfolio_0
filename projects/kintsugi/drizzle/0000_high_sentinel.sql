CREATE TABLE `images` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`content_type` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `offers` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`maker_id` text NOT NULL,
	`price` integer NOT NULL,
	`message` text NOT NULL,
	`days` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `repair_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`maker_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "offer_price" CHECK("offers"."price">0),
	CONSTRAINT "offer_status" CHECK("offers"."status" in ('pending','accepted','rejected','withdrawn'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_offer_maker` ON `offers` (`request_id`,`maker_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_offer_accepted` ON `offers` (`request_id`) WHERE "offers"."status"='accepted';--> statement-breakpoint
CREATE INDEX `idx_offer_maker` ON `offers` (`maker_id`);--> statement-breakpoint
CREATE TABLE `repair_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item_name` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`image_id` text,
	`commune` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`accepted_offer_id` text,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "requests_status" CHECK("repair_requests"."status" in ('open','in_progress','completed','cancelled'))
);
--> statement-breakpoint
CREATE INDEX `idx_requests_user` ON `repair_requests` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_requests_status` ON `repair_requests` (`status`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`offer_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`maker_id` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`maker_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "review_rating" CHECK("reviews"."rating" between 1 and 5)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_review_offer` ON `reviews` (`offer_id`);--> statement-breakpoint
CREATE INDEX `idx_review_maker` ON `reviews` (`maker_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`commune` text DEFAULT 'Santiago' NOT NULL,
	`lat` real DEFAULT -33.4489 NOT NULL,
	`lng` real DEFAULT -70.6693 NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`specialties` text DEFAULT '[]' NOT NULL,
	`base_price` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "users_role" CHECK("users"."role" in ('user','maker')),
	CONSTRAINT "users_price" CHECK("users"."base_price">=0)
);
