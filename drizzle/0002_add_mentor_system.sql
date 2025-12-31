-- Add mentor application status enum
DO $$ BEGIN
  CREATE TYPE mentor_application_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add connection status enum
DO $$ BEGIN
  CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined', 'ended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Mentor Applications table
CREATE TABLE IF NOT EXISTS mentor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT NOT NULL,
  expertise TEXT[] NOT NULL,
  years_experience INTEGER NOT NULL,
  current_role VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  linkedin_url VARCHAR(500),
  motivation TEXT,
  availability VARCHAR(100),
  status mentor_application_status DEFAULT 'pending' NOT NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mentor_applications_user ON mentor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_applications_status ON mentor_applications(status);

-- Mentor Connections table
CREATE TABLE IF NOT EXISTS mentor_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status connection_status DEFAULT 'pending' NOT NULL,
  message TEXT,
  mentor_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(mentor_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_mentor ON mentor_connections(mentor_id);
CREATE INDEX IF NOT EXISTS idx_connections_student ON mentor_connections(student_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON mentor_connections(status);

-- Mentor Availability table
CREATE TABLE IF NOT EXISTS mentor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  timezone VARCHAR(100) DEFAULT 'Africa/Lagos' NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_availability_mentor ON mentor_availability(mentor_id);
CREATE INDEX IF NOT EXISTS idx_availability_day ON mentor_availability(day_of_week);

-- Mentor Messages table
CREATE TABLE IF NOT EXISTS mentor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES mentor_connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mentor_messages_connection ON mentor_messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_mentor_messages_sender ON mentor_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_mentor_messages_created ON mentor_messages(created_at);

-- Add connection_id to mentorship_sessions if not exists
DO $$ BEGIN
  ALTER TABLE mentorship_sessions ADD COLUMN connection_id UUID REFERENCES mentor_connections(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;
