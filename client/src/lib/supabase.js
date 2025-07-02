// irrelevant for now

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Language options for code snippets
export const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'xml', label: 'XML' },
  { value: 'plaintext', label: 'Plain Text' },
]

// Database operations
export const snippetService = {
  // Get all snippets for a user
  async getSnippets(userId) {
    const { data, error } = await supabase
      .from('snippets')
      .select(`
        *,
        snippet_tags (tag),
        folders (name, color),
        projects (name, color)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get snippet by ID
  async getSnippet(id) {
    const { data, error } = await supabase
      .from('snippets')
      .select(`
        *,
        snippet_tags (tag),
        folders (name, color),
        projects (name, color)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create new snippet
  async createSnippet(snippet) {
    const { data, error } = await supabase
      .from('snippets')
      .insert([snippet])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update snippet
  async updateSnippet(id, updates) {
    const { data, error } = await supabase
      .from('snippets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete snippet
  async deleteSnippet(id) {
    const { error } = await supabase
      .from('snippets')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Add tags to snippet
  async addTags(snippetId, tags) {
    const tagData = tags.map(tag => ({ snippet_id: snippetId, tag }))
    const { error } = await supabase
      .from('snippet_tags')
      .insert(tagData)

    if (error) throw error
  },

  // Remove all tags from snippet
  async removeTags(snippetId) {
    const { error } = await supabase
      .from('snippet_tags')
      .delete()
      .eq('snippet_id', snippetId)

    if (error) throw error
  },

  // Search snippets
  async searchSnippets(userId, query) {
    const { data, error } = await supabase
      .from('snippets')
      .select(`
        *,
        snippet_tags (tag),
        folders (name, color),
        projects (name, color)
      `)
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,code.ilike.%${query}%`)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data
  }
}

export const folderService = {
  // Get all folders for a user
  async getFolders(userId) {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) throw error
    return data
  },

  // Create new folder
  async createFolder(folder) {
    const { data, error } = await supabase
      .from('folders')
      .insert([folder])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update folder
  async updateFolder(id, updates) {
    const { data, error } = await supabase
      .from('folders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete folder
  async deleteFolder(id) {
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export const projectService = {
  // Get all projects for a user (owned or member)
  async getProjects(userId) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_members!inner (
          user_id,
          role
        )
      `)
      .or(`owner_id.eq.${userId},project_members.user_id.eq.${userId}`)
      .order('name')

    if (error) throw error
    return data
  },

  // Create new project
  async createProject(project) {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single()

    if (error) throw error

    // Add owner as member
    await supabase
      .from('project_members')
      .insert([{
        project_id: data.id,
        user_id: project.owner_id,
        role: 'owner'
      }])

    return data
  },

  // Update project
  async updateProject(id, updates) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete project
  async deleteProject(id) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Add member to project
  async addMember(projectId, userId, role = 'member') {
    const { data, error } = await supabase
      .from('project_members')
      .insert([{
        project_id: projectId,
        user_id: userId,
        role
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Remove member from project
  async removeMember(projectId, userId) {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (error) throw error
  }
}