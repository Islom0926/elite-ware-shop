ALTER TYPE "public"."order_status" ADD VALUE 'accepted';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'in_delivery';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'at_warehouse';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'shipped';--> statement-breakpoint
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_cart_product_unique";--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "selected_color" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "selected_size" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "selected_color" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "selected_size" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "images" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "colors" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sizes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_product_variant_unique" UNIQUE("cart_id","product_id","selected_color","selected_size");