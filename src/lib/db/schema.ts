import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  pgEnum,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', ['student', 'mentor', 'admin']);
export const moduleStatusEnum = pgEnum('module_status', ['draft', 'review', 'published']);
export const pageTypeEnum = pgEnum('page_type', ['lesson', 'quiz', 'assignment', 'discussion', 'lab']);
export const mediaTypeEnum = pgEnum('media_type', ['video', 'audio', 'image', 'document']);
export const sessionStatusEnum = pgEnum('session_status', ['scheduled', 'completed', 'cancelled', 'no_show']);
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'premium', 'enterprise']);

// ============================================================================
// USERS & PROFILES
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  profilePicture: text('profile_picture'),
  role: userRoleEnum('role').default('student').notNull(),
  // Profile fields
  discipline: varchar('discipline', { length: 255 }),
  qualification: varchar('qualification', { length: 255 }),
  university: varchar('university', { length: 255 }),
  bio: text('bio'),
  linkedinUrl: varchar('linkedin_url', { length: 500 }),
  // Subscription & limits
  subscriptionTier: subscriptionTierEnum('subscription_tier').default('free').notNull(),
  aiMessagesUsed: integer('ai_messages_used').default(0).notNull(),
  aiMessagesLimit: integer('ai_messages_limit').default(10).notNull(), // Free tier: 10/month
  aiMessagesResetAt: timestamp('ai_messages_reset_at', { withTimezone: true }),
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_users_clerk_id').on(table.clerkId),
  index('idx_users_email').on(table.email),
  index('idx_users_role').on(table.role),
]);

// ============================================================================
// MENTORS
// ============================================================================

export const mentors = pgTable('mentors', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  expertise: text('expertise').array(), // Array of expertise areas
  specializations: text('specializations').array(), // Specific specializations
  yearsExperience: integer('years_experience'),
  currentRole: varchar('current_role', { length: 255 }),
  company: varchar('company', { length: 255 }),
  isAvailable: boolean('is_available').default(true).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  sessionCount: integer('session_count').default(0).notNull(),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_mentors_user_id').on(table.userId),
  index('idx_mentors_available').on(table.isAvailable),
  index('idx_mentors_verified').on(table.isVerified),
]);

// ============================================================================
// LEARNING MODULES
// ============================================================================

export const learningModules = pgTable('learning_modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: varchar('module_id', { length: 100 }).notNull().unique(), // Readable ID like "intro-petroleum"
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  duration: varchar('duration', { length: 50 }), // e.g., "2 hours"
  discipline: varchar('discipline', { length: 100 }), // e.g., "geology", "engineering"
  difficultyLevel: varchar('difficulty_level', { length: 50 }), // beginner, intermediate, advanced
  learningObjectives: text('learning_objectives').array(),
  prerequisites: jsonb('prerequisites'), // Array of module_ids
  skillsGained: jsonb('skills_gained'), // Array of skill names
  status: moduleStatusEnum('status').default('draft').notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_modules_status').on(table.status),
  index('idx_modules_discipline').on(table.discipline),
  index('idx_modules_order').on(table.orderIndex),
]);

// ============================================================================
// MODULE SECTIONS
// ============================================================================

export const moduleSections = pgTable('module_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').notNull().references(() => learningModules.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  sequence: integer('sequence').default(0).notNull(),
  estimatedDuration: varchar('estimated_duration', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_sections_module').on(table.moduleId),
  index('idx_sections_sequence').on(table.sequence),
]);

// ============================================================================
// SECTION PAGES
// ============================================================================

export const sectionPages = pgTable('section_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id').notNull().references(() => moduleSections.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'), // Markdown/HTML content
  pageType: pageTypeEnum('page_type').default('lesson').notNull(),
  sequence: integer('sequence').default(0).notNull(),
  estimatedDuration: varchar('estimated_duration', { length: 50 }),
  // Quiz-specific fields
  quizQuestions: jsonb('quiz_questions'), // Array of question objects
  passingScore: integer('passing_score'), // Percentage required to pass
  // Lab-specific fields
  labConfig: jsonb('lab_config'), // Lab configuration: { labType, labUrl, instructions, objectives, tools, scenarios, timeLimit }
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_pages_section').on(table.sectionId),
  index('idx_pages_sequence').on(table.sequence),
]);

// ============================================================================
// MEDIA CONTENT
// ============================================================================

export const mediaContent = pgTable('media_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id').notNull().references(() => sectionPages.id, { onDelete: 'cascade' }),
  type: mediaTypeEnum('type').notNull(),
  url: text('url').notNull(),
  title: varchar('title', { length: 255 }),
  alt: text('alt'), // Alt text for accessibility
  captionsUrl: text('captions_url'), // VTT file for videos
  transcriptUrl: text('transcript_url'), // Full transcript
  sequence: integer('sequence').default(0).notNull(),
  metadata: jsonb('metadata'), // Duration, dimensions, file size, etc.
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_media_page').on(table.pageId),
  index('idx_media_sequence').on(table.sequence),
]);

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export const userModuleProgress = pgTable('user_module_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').notNull().references(() => learningModules.id, { onDelete: 'cascade' }),
  progressPercentage: integer('progress_percentage').default(0).notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }).defaultNow().notNull(),
  currentSectionId: uuid('current_section_id'),
  currentPageId: uuid('current_page_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_module_progress_user').on(table.userId),
  index('idx_module_progress_module').on(table.moduleId),
  unique('unique_user_module_progress').on(table.userId, table.moduleId),
]);

export const userSectionProgress = pgTable('user_section_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sectionId: uuid('section_id').notNull().references(() => moduleSections.id, { onDelete: 'cascade' }),
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  timeSpentSeconds: integer('time_spent_seconds').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_section_progress_user').on(table.userId),
  index('idx_section_progress_section').on(table.sectionId),
  unique('unique_user_section_progress').on(table.userId, table.sectionId),
]);

export const userPageProgress = pgTable('user_page_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pageId: uuid('page_id').notNull().references(() => sectionPages.id, { onDelete: 'cascade' }),
  isCompleted: boolean('is_completed').default(false).notNull(),
  isViewed: boolean('is_viewed').default(false).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  timeSpentSeconds: integer('time_spent_seconds').default(0).notNull(),
  // Quiz-specific
  quizScore: integer('quiz_score'),
  quizAttempts: integer('quiz_attempts').default(0).notNull(),
  quizAnswers: jsonb('quiz_answers'), // User's submitted answers
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_page_progress_user').on(table.userId),
  index('idx_page_progress_page').on(table.pageId),
  unique('unique_user_page_progress').on(table.userId, table.pageId),
]);

// ============================================================================
// MENTORSHIP SESSIONS
// ============================================================================

export const mentorshipSessions = pgTable('mentorship_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  mentorId: uuid('mentor_id').notNull().references(() => mentors.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').default(60).notNull(),
  status: sessionStatusEnum('status').default('scheduled').notNull(),
  meetingUrl: text('meeting_url'),
  topic: varchar('topic', { length: 255 }),
  notes: text('notes'),
  studentNotes: text('student_notes'),
  mentorFeedback: text('mentor_feedback'),
  rating: integer('rating'), // 1-5 rating from student
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_sessions_mentor').on(table.mentorId),
  index('idx_sessions_student').on(table.studentId),
  index('idx_sessions_scheduled').on(table.scheduledAt),
  index('idx_sessions_status').on(table.status),
]);

// ============================================================================
// AI CHAT
// ============================================================================

export const aiChatSessions = pgTable('ai_chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  context: varchar('context', { length: 100 }), // 'career', 'learning', 'general'
  isActive: boolean('is_active').default(true).notNull(),
  messageCount: integer('message_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_chat_sessions_user').on(table.userId),
  index('idx_chat_sessions_active').on(table.isActive),
]);

export const aiChatMessages = pgTable('ai_chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => aiChatSessions.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text('content').notNull(),
  metadata: jsonb('metadata'), // Token count, model used, etc.
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_chat_messages_session').on(table.sessionId),
  index('idx_chat_messages_created').on(table.createdAt),
]);

// ============================================================================
// RESOURCES
// ============================================================================

export const resources = pgTable('resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // 'article', 'video', 'document', 'link'
  category: varchar('category', { length: 100 }),
  url: text('url'),
  content: text('content'), // For articles stored directly
  thumbnailUrl: text('thumbnail_url'),
  isPremium: boolean('is_premium').default(false).notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_resources_type').on(table.type),
  index('idx_resources_category').on(table.category),
  index('idx_resources_published').on(table.isPublished),
]);

// ============================================================================
// LESSON COMMENTS
// ============================================================================

export const lessonComments = pgTable('lesson_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id').notNull().references(() => sectionPages.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  parentId: uuid('parent_id'), // For replies - references another comment
  isEdited: boolean('is_edited').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_comments_page').on(table.pageId),
  index('idx_comments_user').on(table.userId),
  index('idx_comments_parent').on(table.parentId),
  index('idx_comments_created').on(table.createdAt),
]);

// ============================================================================
// LESSON RATINGS
// ============================================================================

export const lessonRatings = pgTable('lesson_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id').notNull().references(() => sectionPages.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5 stars
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_ratings_page').on(table.pageId),
  index('idx_ratings_user').on(table.userId),
  unique('unique_user_page_rating').on(table.userId, table.pageId),
]);

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  mentor: one(mentors, {
    fields: [users.id],
    references: [mentors.userId],
  }),
  moduleProgress: many(userModuleProgress),
  sectionProgress: many(userSectionProgress),
  pageProgress: many(userPageProgress),
  studentSessions: many(mentorshipSessions),
  chatSessions: many(aiChatSessions),
  resources: many(resources),
  comments: many(lessonComments),
  ratings: many(lessonRatings),
}));

export const mentorsRelations = relations(mentors, ({ one, many }) => ({
  user: one(users, {
    fields: [mentors.userId],
    references: [users.id],
  }),
  sessions: many(mentorshipSessions),
}));

export const learningModulesRelations = relations(learningModules, ({ many }) => ({
  sections: many(moduleSections),
  progress: many(userModuleProgress),
}));

export const moduleSectionsRelations = relations(moduleSections, ({ one, many }) => ({
  module: one(learningModules, {
    fields: [moduleSections.moduleId],
    references: [learningModules.id],
  }),
  pages: many(sectionPages),
  progress: many(userSectionProgress),
}));

export const sectionPagesRelations = relations(sectionPages, ({ one, many }) => ({
  section: one(moduleSections, {
    fields: [sectionPages.sectionId],
    references: [moduleSections.id],
  }),
  media: many(mediaContent),
  progress: many(userPageProgress),
  comments: many(lessonComments),
  ratings: many(lessonRatings),
}));

export const mediaContentRelations = relations(mediaContent, ({ one }) => ({
  page: one(sectionPages, {
    fields: [mediaContent.pageId],
    references: [sectionPages.id],
  }),
}));

export const userModuleProgressRelations = relations(userModuleProgress, ({ one }) => ({
  user: one(users, {
    fields: [userModuleProgress.userId],
    references: [users.id],
  }),
  module: one(learningModules, {
    fields: [userModuleProgress.moduleId],
    references: [learningModules.id],
  }),
}));

export const userSectionProgressRelations = relations(userSectionProgress, ({ one }) => ({
  user: one(users, {
    fields: [userSectionProgress.userId],
    references: [users.id],
  }),
  section: one(moduleSections, {
    fields: [userSectionProgress.sectionId],
    references: [moduleSections.id],
  }),
}));

export const userPageProgressRelations = relations(userPageProgress, ({ one }) => ({
  user: one(users, {
    fields: [userPageProgress.userId],
    references: [users.id],
  }),
  page: one(sectionPages, {
    fields: [userPageProgress.pageId],
    references: [sectionPages.id],
  }),
}));

export const mentorshipSessionsRelations = relations(mentorshipSessions, ({ one }) => ({
  mentor: one(mentors, {
    fields: [mentorshipSessions.mentorId],
    references: [mentors.id],
  }),
  student: one(users, {
    fields: [mentorshipSessions.studentId],
    references: [users.id],
  }),
}));

export const aiChatSessionsRelations = relations(aiChatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [aiChatSessions.userId],
    references: [users.id],
  }),
  messages: many(aiChatMessages),
}));

export const aiChatMessagesRelations = relations(aiChatMessages, ({ one }) => ({
  session: one(aiChatSessions, {
    fields: [aiChatMessages.sessionId],
    references: [aiChatSessions.id],
  }),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  author: one(users, {
    fields: [resources.authorId],
    references: [users.id],
  }),
}));

export const lessonCommentsRelations = relations(lessonComments, ({ one }) => ({
  page: one(sectionPages, {
    fields: [lessonComments.pageId],
    references: [sectionPages.id],
  }),
  user: one(users, {
    fields: [lessonComments.userId],
    references: [users.id],
  }),
}));

export const lessonRatingsRelations = relations(lessonRatings, ({ one }) => ({
  page: one(sectionPages, {
    fields: [lessonRatings.pageId],
    references: [sectionPages.id],
  }),
  user: one(users, {
    fields: [lessonRatings.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// COURSE ENROLLMENTS
// ============================================================================

export const courseEnrollments = pgTable('course_enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').notNull().references(() => learningModules.id, { onDelete: 'cascade' }),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(), // active, completed, dropped
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_enrollments_user').on(table.userId),
  index('idx_enrollments_module').on(table.moduleId),
  unique('unique_user_module_enrollment').on(table.userId, table.moduleId),
]);

export const courseEnrollmentsRelations = relations(courseEnrollments, ({ one }) => ({
  user: one(users, {
    fields: [courseEnrollments.userId],
    references: [users.id],
  }),
  module: one(learningModules, {
    fields: [courseEnrollments.moduleId],
    references: [learningModules.id],
  }),
}));

// ============================================================================
// CERTIFICATES
// ============================================================================

export const certificates = pgTable('certificates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').notNull().references(() => learningModules.id, { onDelete: 'cascade' }),
  certificateNumber: varchar('certificate_number', { length: 50 }).notNull().unique(),
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_certificates_user').on(table.userId),
  index('idx_certificates_module').on(table.moduleId),
  unique('unique_user_module_certificate').on(table.userId, table.moduleId),
]);

export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(users, {
    fields: [certificates.userId],
    references: [users.id],
  }),
  module: one(learningModules, {
    fields: [certificates.moduleId],
    references: [learningModules.id],
  }),
}));

// ============================================================================
// BOOKMARKS
// ============================================================================

export const bookmarks = pgTable('bookmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pageId: uuid('page_id').notNull().references(() => sectionPages.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_bookmarks_user').on(table.userId),
  index('idx_bookmarks_page').on(table.pageId),
  unique('unique_user_page_bookmark').on(table.userId, table.pageId),
]);

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  page: one(sectionPages, {
    fields: [bookmarks.pageId],
    references: [sectionPages.id],
  }),
}));

// ============================================================================
// LESSON NOTES
// ============================================================================

export const lessonNotes = pgTable('lesson_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pageId: uuid('page_id').notNull().references(() => sectionPages.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_notes_user').on(table.userId),
  index('idx_notes_page').on(table.pageId),
  unique('unique_user_page_note').on(table.userId, table.pageId),
]);

export const lessonNotesRelations = relations(lessonNotes, ({ one }) => ({
  user: one(users, {
    fields: [lessonNotes.userId],
    references: [users.id],
  }),
  page: one(sectionPages, {
    fields: [lessonNotes.pageId],
    references: [sectionPages.id],
  }),
}));

// ============================================================================
// USER STREAKS
// ============================================================================

export const userStreaks = pgTable('user_streaks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastActivityDate: timestamp('last_activity_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_streaks_user').on(table.userId),
]);

export const userStreaksRelations = relations(userStreaks, ({ one }) => ({
  user: one(users, {
    fields: [userStreaks.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(), // e.g., 'first_lesson', 'streak_7'
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }), // Icon name or emoji
  category: varchar('category', { length: 50 }), // 'completion', 'streak', 'engagement'
  points: integer('points').default(10).notNull(),
  requirement: jsonb('requirement'), // JSON defining the criteria
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_achievements_code').on(table.code),
  index('idx_achievements_category').on(table.category),
]);

export const userAchievements = pgTable('user_achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: uuid('achievement_id').notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  earnedAt: timestamp('earned_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_user_achievements_user').on(table.userId),
  index('idx_user_achievements_achievement').on(table.achievementId),
  unique('unique_user_achievement').on(table.userId, table.achievementId),
]);

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Mentor = typeof mentors.$inferSelect;
export type NewMentor = typeof mentors.$inferInsert;

export type LearningModule = typeof learningModules.$inferSelect;
export type NewLearningModule = typeof learningModules.$inferInsert;

export type ModuleSection = typeof moduleSections.$inferSelect;
export type NewModuleSection = typeof moduleSections.$inferInsert;

export type SectionPage = typeof sectionPages.$inferSelect;
export type NewSectionPage = typeof sectionPages.$inferInsert;

export type MediaContent = typeof mediaContent.$inferSelect;
export type NewMediaContent = typeof mediaContent.$inferInsert;

export type UserModuleProgress = typeof userModuleProgress.$inferSelect;
export type NewUserModuleProgress = typeof userModuleProgress.$inferInsert;

export type UserSectionProgress = typeof userSectionProgress.$inferSelect;
export type NewUserSectionProgress = typeof userSectionProgress.$inferInsert;

export type UserPageProgress = typeof userPageProgress.$inferSelect;
export type NewUserPageProgress = typeof userPageProgress.$inferInsert;

export type MentorshipSession = typeof mentorshipSessions.$inferSelect;
export type NewMentorshipSession = typeof mentorshipSessions.$inferInsert;

export type AiChatSession = typeof aiChatSessions.$inferSelect;
export type NewAiChatSession = typeof aiChatSessions.$inferInsert;

export type AiChatMessage = typeof aiChatMessages.$inferSelect;
export type NewAiChatMessage = typeof aiChatMessages.$inferInsert;

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;

export type LessonComment = typeof lessonComments.$inferSelect;
export type NewLessonComment = typeof lessonComments.$inferInsert;

export type LessonRating = typeof lessonRatings.$inferSelect;
export type NewLessonRating = typeof lessonRatings.$inferInsert;

export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;

export type LessonNote = typeof lessonNotes.$inferSelect;
export type NewLessonNote = typeof lessonNotes.$inferInsert;

export type UserStreak = typeof userStreaks.$inferSelect;
export type NewUserStreak = typeof userStreaks.$inferInsert;

export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;

export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type NewCourseEnrollment = typeof courseEnrollments.$inferInsert;
