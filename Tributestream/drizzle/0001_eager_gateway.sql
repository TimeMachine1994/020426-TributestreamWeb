CREATE TABLE `stream` (
	`id` text PRIMARY KEY NOT NULL,
	`memorial_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'idle' NOT NULL,
	`scheduled_start_time` integer,
	`mux_live_stream_id` text,
	`mux_stream_key` text,
	`mux_playback_id` text,
	`mux_recording_ready` integer DEFAULT false NOT NULL,
	`calculator_service_type` text,
	`calculator_service_index` integer,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`memorial_id`) REFERENCES `memorial`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `memorial` ADD `loved_one_name` text;--> statement-breakpoint
ALTER TABLE `memorial` ADD `full_slug` text;--> statement-breakpoint
ALTER TABLE `memorial` ADD `owner_id` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `memorial` ADD `is_public` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `memorial` ADD `image_url` text;--> statement-breakpoint
ALTER TABLE `memorial` ADD `birth_date` text;--> statement-breakpoint
ALTER TABLE `memorial` ADD `death_date` text;--> statement-breakpoint
ALTER TABLE `memorial` ADD `content` text;--> statement-breakpoint
ALTER TABLE `memorial` ADD `services_json` text;--> statement-breakpoint
ALTER TABLE `memorial` ADD `calculator_config_json` text;--> statement-breakpoint
ALTER TABLE `memorial` ADD `is_paid` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `memorial` ADD `payment_status` text DEFAULT 'unpaid';--> statement-breakpoint
ALTER TABLE `memorial` ADD `total_price` real;--> statement-breakpoint
ALTER TABLE `memorial` ADD `family_contact_name` text;--> statement-breakpoint
ALTER TABLE `memorial` ADD `family_contact_email` text;--> statement-breakpoint
ALTER TABLE `memorial` ADD `family_contact_phone` text;--> statement-breakpoint
ALTER TABLE `memorial` ADD `director_full_name` text;--> statement-breakpoint
ALTER TABLE `memorial` ADD `director_email` text;--> statement-breakpoint
ALTER TABLE `memorial` ADD `funeral_home_name` text;--> statement-breakpoint
ALTER TABLE `memorial` ADD `custom_pricing_json` text;--> statement-breakpoint
CREATE UNIQUE INDEX `memorial_full_slug_unique` ON `memorial` (`full_slug`);