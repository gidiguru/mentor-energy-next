CREATE TYPE "public"."media_type" AS ENUM('video', 'audio', 'image', 'document');--> statement-breakpoint
CREATE TYPE "public"."module_status" AS ENUM('draft', 'review', 'published');--> statement-breakpoint
CREATE TYPE "public"."page_type" AS ENUM('lesson', 'quiz', 'assignment', 'discussion');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('scheduled', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'premium', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'mentor', 'admin');--> statement-breakpoint
CREATE TABLE "ai_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255),
	"context" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"duration" varchar(50),
	"discipline" varchar(100),
	"difficulty_level" varchar(50),
	"learning_objectives" text[],
	"prerequisites" jsonb,
	"skills_gained" jsonb,
	"status" "module_status" DEFAULT 'draft' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"thumbnail_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_modules_module_id_unique" UNIQUE("module_id")
);
--> statement-breakpoint
CREATE TABLE "media_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"type" "media_type" NOT NULL,
	"url" text NOT NULL,
	"title" varchar(255),
	"alt" text,
	"captions_url" text,
	"transcript_url" text,
	"sequence" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bio" text,
	"expertise" text[],
	"specializations" text[],
	"years_experience" integer,
	"current_role" varchar(255),
	"company" varchar(255),
	"is_available" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"hourly_rate" numeric(10, 2),
	"session_count" integer DEFAULT 0 NOT NULL,
	"average_rating" numeric(3, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentorship_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"status" "session_status" DEFAULT 'scheduled' NOT NULL,
	"meeting_url" text,
	"topic" varchar(255),
	"notes" text,
	"student_notes" text,
	"mentor_feedback" text,
	"rating" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"sequence" integer DEFAULT 0 NOT NULL,
	"estimated_duration" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"category" varchar(100),
	"url" text,
	"content" text,
	"thumbnail_url" text,
	"is_premium" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"author_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "section_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"page_type" "page_type" DEFAULT 'lesson' NOT NULL,
	"sequence" integer DEFAULT 0 NOT NULL,
	"estimated_duration" varchar(50),
	"quiz_questions" jsonb,
	"passing_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_module_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"progress_percentage" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"last_accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"current_section_id" uuid,
	"current_page_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_module_progress" UNIQUE("user_id","module_id")
);
--> statement-breakpoint
CREATE TABLE "user_page_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"page_id" uuid NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"is_viewed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"quiz_score" integer,
	"quiz_attempts" integer DEFAULT 0 NOT NULL,
	"quiz_answers" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_page_progress" UNIQUE("user_id","page_id")
);
--> statement-breakpoint
CREATE TABLE "user_section_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_section_progress" UNIQUE("user_id","section_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"profile_picture" text,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"discipline" varchar(255),
	"qualification" varchar(255),
	"university" varchar(255),
	"bio" text,
	"linkedin_url" varchar(500),
	"subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"ai_messages_used" integer DEFAULT 0 NOT NULL,
	"ai_messages_limit" integer DEFAULT 10 NOT NULL,
	"ai_messages_reset_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_session_id_ai_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."ai_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat_sessions" ADD CONSTRAINT "ai_chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_content" ADD CONSTRAINT "media_content_page_id_section_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."section_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentors" ADD CONSTRAINT "mentors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_mentor_id_mentors_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_sections" ADD CONSTRAINT "module_sections_module_id_learning_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."learning_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_pages" ADD CONSTRAINT "section_pages_section_id_module_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."module_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_module_progress" ADD CONSTRAINT "user_module_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_module_progress" ADD CONSTRAINT "user_module_progress_module_id_learning_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."learning_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_page_progress" ADD CONSTRAINT "user_page_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_page_progress" ADD CONSTRAINT "user_page_progress_page_id_section_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."section_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_section_progress" ADD CONSTRAINT "user_section_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_section_progress" ADD CONSTRAINT "user_section_progress_section_id_module_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."module_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chat_messages_session" ON "ai_chat_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_created" ON "ai_chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_chat_sessions_user" ON "ai_chat_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_chat_sessions_active" ON "ai_chat_sessions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_modules_status" ON "learning_modules" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_modules_discipline" ON "learning_modules" USING btree ("discipline");--> statement-breakpoint
CREATE INDEX "idx_modules_order" ON "learning_modules" USING btree ("order_index");--> statement-breakpoint
CREATE INDEX "idx_media_page" ON "media_content" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "idx_media_sequence" ON "media_content" USING btree ("sequence");--> statement-breakpoint
CREATE INDEX "idx_mentors_user_id" ON "mentors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_mentors_available" ON "mentors" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "idx_mentors_verified" ON "mentors" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "idx_sessions_mentor" ON "mentorship_sessions" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_student" ON "mentorship_sessions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_scheduled" ON "mentorship_sessions" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_status" ON "mentorship_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sections_module" ON "module_sections" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "idx_sections_sequence" ON "module_sections" USING btree ("sequence");--> statement-breakpoint
CREATE INDEX "idx_resources_type" ON "resources" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_resources_category" ON "resources" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_resources_published" ON "resources" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "idx_pages_section" ON "section_pages" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_pages_sequence" ON "section_pages" USING btree ("sequence");--> statement-breakpoint
CREATE INDEX "idx_module_progress_user" ON "user_module_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_module_progress_module" ON "user_module_progress" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "idx_page_progress_user" ON "user_page_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_page_progress_page" ON "user_page_progress" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "idx_section_progress_user" ON "user_section_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_section_progress_section" ON "user_section_progress" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_users_clerk_id" ON "users" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");