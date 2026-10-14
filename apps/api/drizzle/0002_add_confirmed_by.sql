ALTER TABLE "shops" ALTER COLUMN "currency" SET DEFAULT 'UZS';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "confirmed_by" bigint;