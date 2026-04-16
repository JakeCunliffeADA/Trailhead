CREATE TABLE `accounts` (
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_provider_account` ON `accounts` (`provider`,`provider_account_id`);--> statement-breakpoint
CREATE TABLE `gear_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`category` text,
	`description` text,
	`weight_grams` real,
	`purchase_date` integer,
	`temp_rating_low_c` real,
	`temp_rating_high_c` real,
	`tags` text DEFAULT '[]' NOT NULL,
	`retired_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_gear_items_user_id` ON `gear_items` (`user_id`);--> statement-breakpoint
CREATE TABLE `kit_list_items` (
	`id` text PRIMARY KEY NOT NULL,
	`kit_list_id` text NOT NULL,
	`gear_item_id` text NOT NULL,
	`optional` integer DEFAULT false NOT NULL,
	`notes` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`kit_list_id`) REFERENCES `kit_lists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`gear_item_id`) REFERENCES `gear_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `kit_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_kit_lists_user_id` ON `kit_lists` (`user_id`);--> statement-breakpoint
CREATE TABLE `routes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`source` text,
	`distance_m` real,
	`ascent_m` real,
	`descent_m` real,
	`min_elevation_m` real,
	`max_elevation_m` real,
	`naismith_minutes` integer,
	`geojson` text NOT NULL,
	`gpx_raw` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_routes_user_id` ON `routes` (`user_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`session_token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `trip_packing_items` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`gear_item_id` text,
	`name` text NOT NULL,
	`weight_grams` real,
	`category` text,
	`optional` integer DEFAULT false NOT NULL,
	`notes` text,
	`packed` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`gear_item_id`) REFERENCES `gear_items`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_trip_packing_items_trip_id` ON `trip_packing_items` (`trip_id`);--> statement-breakpoint
CREATE TABLE `trip_routes` (
	`trip_id` text NOT NULL,
	`route_id` text NOT NULL,
	`day_number` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trip_routes_trip_route` ON `trip_routes` (`trip_id`,`route_id`);--> statement-breakpoint
CREATE TABLE `trips` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_trips_user_id` ON `trips` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`email_verified` integer,
	`image` text,
	`unit_distance` text DEFAULT 'miles' NOT NULL,
	`unit_temperature` text DEFAULT 'celsius' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_identifier_token` ON `verification_tokens` (`identifier`,`token`);--> statement-breakpoint
CREATE TABLE `weather_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`route_id` text,
	`forecast_date` integer NOT NULL,
	`elevation_m` real NOT NULL,
	`forecast_json` text NOT NULL,
	`fetched_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`stale_after` integer NOT NULL,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weather_cache_trip_route_date` ON `weather_cache` (`trip_id`,`route_id`,`forecast_date`);--> statement-breakpoint
CREATE INDEX `idx_weather_cache_trip_id` ON `weather_cache` (`trip_id`);