ALTER TABLE "modules" DROP CONSTRAINT "modules_reference_id_unique";--> statement-breakpoint
ALTER TABLE "nodes" DROP CONSTRAINT "nodes_reference_id_unique";--> statement-breakpoint
ALTER TABLE "zones" DROP CONSTRAINT "zones_reference_id_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "modules_reference_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "nodes_reference_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "zones_reference_id_idx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "modules_user_reference_id_unique" ON "modules" ("user_id","reference_id") WHERE "reference_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "nodes_user_reference_id_unique" ON "nodes" ("user_id","reference_id") WHERE "reference_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "zones_user_reference_id_unique" ON "zones" ("user_id","reference_id") WHERE "reference_id" IS NOT NULL;