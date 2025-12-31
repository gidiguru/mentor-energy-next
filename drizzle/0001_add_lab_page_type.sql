-- Add 'lab' to page_type enum
ALTER TYPE page_type ADD VALUE IF NOT EXISTS 'lab';

-- Add lab_config column to section_pages
ALTER TABLE section_pages ADD COLUMN IF NOT EXISTS lab_config JSONB;

-- Comment explaining the lab_config structure
COMMENT ON COLUMN section_pages.lab_config IS 'Lab configuration JSON: { labType: "simulation"|"interactive"|"sandbox"|"guided", labUrl?: string, instructions: string[], objectives: string[], tools?: string[], scenarios?: object[], timeLimit?: number }';
