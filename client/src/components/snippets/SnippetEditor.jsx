import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { LANGUAGES } from '@/lib/constants'
import { snippetsApi, foldersApi, projectsApi } from '@/lib/api'
import { UserAuth } from '@/context/AuthContext'
import MonacoEditor from '@monaco-editor/react'
import { useTheme } from '@/components/theme-provider'

export default function SnippetEditor({ snippet, isEditing = false }) {
  const { session } = UserAuth()
  const { theme } = useTheme()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    title: snippet?.title || '',
    description: snippet?.description || '',
    code: snippet?.code || '',
    language: snippet?.language || 'javascript',
    folder_id: snippet?.folder_id || null,
    project_id: snippet?.project_id || null,
    is_favorite: snippet?.is_favorite || false,
    is_public: snippet?.is_public || false,
  })

  const [tags, setTags] = useState(
    snippet?.snippet_tags?.map(t => t.tag).join(', ') || ''
  )
  const [folders, setFolders] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [organizationType, setOrganizationType] = useState(
    snippet?.folder_id ? 'folder' : snippet?.project_id ? 'project' : 'none'
  )

  useEffect(() => {
    loadFoldersAndProjects()
  }, [])

  const loadFoldersAndProjects = async () => {
    try {
      const [foldersData, projectsData] = await Promise.all([
        foldersApi.getFolders(),
        projectsApi.getProjects()
      ])
      setFolders(foldersData)
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading folders and projects:', error)
      toast({
        title: "Error",
        description: "Failed to load folders and projects.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.code.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and code are required.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const snippetData = {
        ...formData,
        folder_id: organizationType === 'folder' ? formData.folder_id : null,
        project_id: organizationType === 'project' ? formData.project_id : null,
      }

      let savedSnippet
      if (isEditing) {
        savedSnippet = await snippetsApi.updateSnippet(snippet.id, snippetData)
      } else {
        savedSnippet = await snippetsApi.createSnippet(snippetData)
      }

      // Update tags
      if (tags.trim()) {
        const tagArray = tags.split(',').map(tag => tag.trim()).filter(Boolean)
        await snippetsApi.updateTags(savedSnippet.id, tagArray)
      } else {
        await snippetsApi.updateTags(savedSnippet.id, [])
      }

      toast({
        title: isEditing ? "Snippet updated" : "Snippet created",
        description: `Your snippet has been ${isEditing ? 'updated' : 'created'} successfully.`,
      })

      navigate(`/dashboard/snippet/${savedSnippet.id}`)
    } catch (error) {
      console.error('Error saving snippet:', error)
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} snippet. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOrganizationChange = (type, value) => {
    setOrganizationType(type)
    if (type === 'folder') {
      setFormData(prev => ({ ...prev, folder_id: value, project_id: null }))
    } else if (type === 'project') {
      setFormData(prev => ({ ...prev, project_id: value, folder_id: null }))
    } else {
      setFormData(prev => ({ ...prev, folder_id: null, project_id: null }))
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Snippet' : 'Create New Snippet'}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? 'Update your code snippet' : 'Add a new code snippet to your collection'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter snippet title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language *</Label>
            <Select
              value={formData.language}
              onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of the snippet"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Enter tags separated by commas"
          />
          <p className="text-xs text-muted-foreground">
            Separate multiple tags with commas (e.g., react, hooks, javascript)
          </p>
        </div>

        <div className="space-y-4">
          <Label>Organization</Label>
          <Tabs value={organizationType} onValueChange={setOrganizationType}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="none">None</TabsTrigger>
              <TabsTrigger value="folder">Folder</TabsTrigger>
              <TabsTrigger value="project">Project</TabsTrigger>
            </TabsList>
            
            <TabsContent value="folder" className="mt-4">
              <Select
                value={formData.folder_id || ''}
                onValueChange={(value) => handleOrganizationChange('folder', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
            
            <TabsContent value="project" className="mt-4">
              <Select
                value={formData.project_id || ''}
                onValueChange={(value) => handleOrganizationChange('project', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">Code *</Label>
          <div className="border rounded-md overflow-hidden">
            <MonacoEditor
              height="400px"
              language={formData.language}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={formData.code}
              onChange={(value) => setFormData(prev => ({ ...prev, code: value || '' }))}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                insertSpaces: true,
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (isEditing ? 'Update Snippet' : 'Create Snippet')}
          </Button>
        </div>
      </form>
    </div>
  )
}