-- =================================================================
-- Helper Function to automatically update 'updated_at' timestamps
-- =================================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =================================================================
-- Core Tables
-- =================================================================

-- auth_users table to replace Supabase auth
CREATE TABLE IF NOT EXISTS auth_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  encrypted_password text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- profiles table for user metadata
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- languages table for standardization
CREATE TABLE IF NOT EXISTS languages (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL -- e.g., 'javascript', 'python'
);

-- folders table for personal organization
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth_users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- projects table for shared workspaces
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth_users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#10B981',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- project members table for collaboration
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth_users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- snippets table
CREATE TABLE IF NOT EXISTS snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth_users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  code text NOT NULL,
  language_id integer REFERENCES languages(id) ON DELETE SET NULL,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  is_favorite boolean DEFAULT false,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT snippets_organization_check CHECK (
    (folder_id IS NOT NULL AND project_id IS NULL) OR
    (folder_id IS NULL AND project_id IS NOT NULL) OR
    (folder_id IS NULL AND project_id IS NULL)
  )
);

-- snippet tags table
CREATE TABLE IF NOT EXISTS snippet_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id uuid REFERENCES snippets(id) ON DELETE CASCADE NOT NULL,
  tag text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(snippet_id, tag),
  CONSTRAINT tag_is_lowercase CHECK (tag = lower(tag))
);


-- =================================================================
-- Triggers for 'updated_at'
-- =================================================================
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON folders
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON snippets
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();


-- =================================================================
-- Indexes for Performance
-- =================================================================
-- Create a case-insensitive unique index on the email column
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_users_lower_email_unique ON auth_users (LOWER(email));

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_snippets_user_id ON snippets(user_id);
CREATE INDEX IF NOT EXISTS idx_snippets_folder_id ON snippets(folder_id);
CREATE INDEX IF NOT EXISTS idx_snippets_project_id ON snippets(project_id);
CREATE INDEX IF NOT EXISTS idx_snippet_tags_snippet_id ON snippet_tags(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_tags_tag ON snippet_tags(tag);


-- =================================================================
-- Seed Data
-- =================================================================
INSERT INTO languages (name, slug) VALUES
('JavaScript', 'javascript'),
('TypeScript', 'typescript'),
('Python', 'python'),
('Java', 'java'),
('C#', 'csharp'),
('C++', 'cpp'),
('C', 'c'),
('Go', 'go'),
('Rust', 'rust'),
('PHP', 'php'),
('Ruby', 'ruby'),
('Swift', 'swift'),
('Kotlin', 'kotlin'),
('Dart', 'dart'),
('HTML', 'html'),
('CSS', 'css'),
('SQL', 'sql'),
('Shell', 'shell'),
('PowerShell', 'powershell'),
('YAML', 'yaml'),
('JSON', 'json'),
('Markdown', 'markdown'),
('Dockerfile', 'dockerfile'),
('Plain Text', 'text')
ON CONFLICT (slug) DO NOTHING;