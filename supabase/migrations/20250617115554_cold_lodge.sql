/*
  # SnipSort Database Schema

  1. New Tables
    - `profiles` - User profile information
    - `folders` - Personal folders for organizing snippets
    - `projects` - Shared workspaces for collaboration
    - `project_members` - Project membership and permissions
    - `snippets` - Code snippets with metadata
    - `snippet_tags` - Tags associated with snippets

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Project-based access control for shared snippets
*/

-- Create profiles table for user metadata
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create folders table for personal organization
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create projects table for shared workspaces
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#10B981',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project members table for collaboration
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create snippets table
CREATE TABLE IF NOT EXISTS snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  code text NOT NULL,
  language text NOT NULL DEFAULT 'javascript',
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

-- Create snippet tags table
CREATE TABLE IF NOT EXISTS snippet_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id uuid REFERENCES snippets(id) ON DELETE CASCADE NOT NULL,
  tag text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(snippet_id, tag)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippet_tags ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Folders policies
CREATE POLICY "Users can manage own folders"
  ON folders FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can read projects they're members of"
  ON projects FOR SELECT
  TO authenticated
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projects.id AND user_id = auth.uid()
    ) OR
    is_public = true
  );

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Project owners can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Project owners can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Project members policies
CREATE POLICY "Users can read project memberships"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can manage members"
  ON project_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- Snippets policies
CREATE POLICY "Users can read accessible snippets"
  ON snippets FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    is_public = true OR
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = snippets.project_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create snippets"
  ON snippets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snippets or project snippets"
  ON snippets FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = snippets.project_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete own snippets"
  ON snippets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Snippet tags policies
CREATE POLICY "Users can read tags for accessible snippets"
  ON snippet_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM snippets
      WHERE id = snippet_id AND (
        user_id = auth.uid() OR
        is_public = true OR
        (project_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM project_members
          WHERE project_id = snippets.project_id AND user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can manage tags for their snippets"
  ON snippet_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM snippets
      WHERE id = snippet_id AND user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_snippets_user_id ON snippets(user_id);
CREATE INDEX IF NOT EXISTS idx_snippets_folder_id ON snippets(folder_id);
CREATE INDEX IF NOT EXISTS idx_snippets_project_id ON snippets(project_id);
CREATE INDEX IF NOT EXISTS idx_snippet_tags_snippet_id ON snippet_tags(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_tags_tag ON snippet_tags(tag);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;