-- Update all foreign key references from auth.users to auth_users
DO $$
BEGIN
  -- Update folders table
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'folders_user_id_fkey' AND table_name = 'folders'
  ) THEN
    ALTER TABLE folders DROP CONSTRAINT folders_user_id_fkey;
  END IF;
  ALTER TABLE folders ADD CONSTRAINT folders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE;

  -- Update projects table
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'projects_owner_id_fkey' AND table_name = 'projects'
  ) THEN
    ALTER TABLE projects DROP CONSTRAINT projects_owner_id_fkey;
  END IF;
  ALTER TABLE projects ADD CONSTRAINT projects_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES auth_users(id) ON DELETE CASCADE;

  -- Update project_members table
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'project_members_user_id_fkey' AND table_name = 'project_members'
  ) THEN
    ALTER TABLE project_members DROP CONSTRAINT project_members_user_id_fkey;
  END IF;
  ALTER TABLE project_members ADD CONSTRAINT project_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE;

  -- Update snippets table
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'snippets_user_id_fkey' AND table_name = 'snippets'
  ) THEN
    ALTER TABLE snippets DROP CONSTRAINT snippets_user_id_fkey;
  END IF;
  ALTER TABLE snippets ADD CONSTRAINT snippets_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE;
END $$;