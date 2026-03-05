CREATE TABLE "posts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"description" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"title" varchar(256) NOT NULL,
	"author" varchar DEFAULT 'Author' NOT NULL,
	"keywords" varchar[] DEFAULT '{}'::text[] NOT NULL,
	"category" varchar NOT NULL,
	"tags" varchar[] DEFAULT '{}'::text[] NOT NULL,
	"content" text NOT NULL,
	"featured_image" varchar,
	"published_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "slug_idx" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "title_idx" ON "posts" USING btree ("title");