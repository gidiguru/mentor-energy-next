// Basic JSON type
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Database interface
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      learning_modules: {
        Row: LearningModule;
        Insert: Omit<LearningModule, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LearningModule, 'id'>>;
      };
      module_sections: {
        Row: ModuleSection;
        Insert: Omit<ModuleSection, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ModuleSection, 'id'>>;
      };
      section_pages: {
        Row: SectionPage;
        Insert: Omit<SectionPage, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SectionPage, 'id'>>;
      };
      media_content: {
        Row: MediaContent;
        Insert: Omit<MediaContent, 'id' | 'created_at'>;
        Update: Partial<Omit<MediaContent, 'id'>>;
      };
      section_progress: {
        Row: SectionProgress;
        Insert: Omit<SectionProgress, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SectionProgress, 'id'>>;
      };
    };
  };
}

// User interface
export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture: string | null;
  role: 'student' | 'mentor' | 'admin';
  discipline: string | null;
  qualification: string | null;
  university: string | null;
  created_at: string;
  updated_at: string;
}

// Base module interfaces
export interface LearningModule {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  duration: string | null;
  discipline: string | null;
  difficulty_level: string | null;
  learning_objectives: string[] | null;
  prerequisites: Json | null;
  skills_gained: Json | null;
  status: 'draft' | 'review' | 'published';
  created_at?: string;
  updated_at?: string;
}

export interface ModuleSection {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  sequence: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface SectionPage {
  id: string;
  section_id: string;
  title: string;
  content: string;
  page_type: 'lesson' | 'quiz' | 'assignment' | 'discussion';
  sequence: number;
  estimated_duration: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ModuleContent {
  id: string;
  title: string;
  description: string | undefined;
  sections: SectionContent[];
}

export interface SectionContent {
  id: string;
  title: string;
  sequence: number;
  pages: PageContent[];
}

export interface PageContent {
  id: string;
  title: string;
  content: string;
  page_type: 'lesson' | 'quiz' | 'assignment' | 'discussion';
  sequence: number;
  media_content: Array<{
    id: string;
    url: string;
    type: string;
  }>;
}

export interface MediaContent {
  id: string;
  page_id: string;
  type: 'video' | 'audio' | 'image' | 'document';
  url: string;
  title?: string | null;
  alt?: string | null;
  captions_url?: string | null;
  descriptions_url?: string | null;
  sequence: number;
  created_at: string | null;
}

// Progress tracking interfaces
export interface UserProgress {
  id: string;
  user_id: string;
  module_id: string;
  section_id: string;
  page_id: string;
  completed: boolean;
  viewed: boolean;
  time_spent: string;
  score: number | null;
  last_viewed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Combined interfaces for UI
export interface PageWithMedia extends SectionPage {
  media_content: MediaContent[];
}

export interface SectionWithPages extends ModuleSection {
  pages: PageWithMedia[];
}

export interface ModuleWithContent extends LearningModule {
  sections: SectionWithPages[];
}

// Progress tracking types
export interface PageProgress {
  completed: boolean;
  viewed: boolean;
  time_spent: string;
  last_viewed_at: string | null;
  score: number | null;
}

export interface SectionProgress {
  id: string;
  user_id: string;
  module_id: string;
  section_id: string;
  page_id: string;
  viewed: boolean;
  time_spent: string;
  score: number | null;
  last_viewed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  completed: boolean;
  pages: Record<string, PageProgress>;
  current_page_id: string | null;
}

export interface ModuleProgress {
  module_id: string;
  sections: Record<string, SectionProgress>;
  current_section_id: string | null;
  overall_progress: number;
}

export interface ModuleSectionWithMedia extends ModuleSection {
  pages: PageWithMedia[];
}
