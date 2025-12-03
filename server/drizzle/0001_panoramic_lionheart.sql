CREATE TABLE IF NOT EXISTS "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"reference_id" varchar(50),
	"type" varchar(50) NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"position_x" integer DEFAULT 0 NOT NULL,
	"position_y" integer DEFAULT 0 NOT NULL,
	"width" integer DEFAULT 4 NOT NULL,
	"height" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "modules_reference_id_unique" UNIQUE("reference_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"reference_id" varchar(50),
	"color" varchar(7),
	"icon" varchar(50),
	"position" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "zones_reference_id_unique" UNIQUE("reference_id")
);
--> statement-breakpoint
ALTER TABLE "nodes" ADD COLUMN "reference_id" varchar(50);--> statement-breakpoint
ALTER TABLE "nodes" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "modules_user_id_idx" ON "modules" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "modules_zone_id_idx" ON "modules" ("zone_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "modules_reference_id_idx" ON "modules" ("reference_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "zones_user_id_idx" ON "zones" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "zones_reference_id_idx" ON "zones" ("reference_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nodes_reference_id_idx" ON "nodes" ("reference_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "modules" ADD CONSTRAINT "modules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "modules" ADD CONSTRAINT "modules_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "zones" ADD CONSTRAINT "zones_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_reference_id_unique" UNIQUE("reference_id");