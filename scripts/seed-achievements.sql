-- Seed achievements table
-- Run this in your Supabase SQL Editor or database client

INSERT INTO achievements (code, name, description, icon, category, points) VALUES
-- Lesson completion achievements
('first_lesson', 'First Steps', 'Complete your first lesson', '🎯', 'completion', 10),
('lessons_5', 'Getting Started', 'Complete 5 lessons', '📚', 'completion', 25),
('lessons_10', 'Dedicated Learner', 'Complete 10 lessons', '🌟', 'completion', 50),
('lessons_25', 'Knowledge Seeker', 'Complete 25 lessons', '🔥', 'completion', 100),
('lessons_50', 'Half Century', 'Complete 50 lessons', '🏅', 'completion', 200),
('lessons_100', 'Century Scholar', 'Complete 100 lessons', '🎓', 'completion', 500),

-- Streak achievements
('streak_3', 'Consistent Starter', 'Maintain a 3-day learning streak', '⚡', 'streak', 15),
('streak_7', 'Week Warrior', 'Maintain a 7-day learning streak', '🔥', 'streak', 50),
('streak_14', 'Fortnight Focus', 'Maintain a 14-day learning streak', '💪', 'streak', 100),
('streak_30', 'Monthly Master', 'Maintain a 30-day learning streak', '🏆', 'streak', 250),

-- Certificate achievements
('first_certificate', 'Certified', 'Earn your first certificate', '📜', 'certificate', 100),
('certificates_3', 'Triple Certified', 'Earn 3 certificates', '🎖️', 'certificate', 250),
('certificates_5', 'Expert Certified', 'Earn 5 certificates', '👑', 'certificate', 500),

-- Engagement achievements
('first_comment', 'Conversation Starter', 'Post your first comment', '💬', 'engagement', 10),
('comments_10', 'Active Contributor', 'Post 10 comments', '🗣️', 'engagement', 50)

ON CONFLICT (code) DO NOTHING;
