import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { useTheme } from '@/components/theme-provider';
import { toast } from 'sonner';
import { languages } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { snippetApi, folderApi, projectApi } from '@/lib/api';

export default function SnippetEditor({ folderId: initialFolderId, folderName, projectId: initialProjectId, projectName }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isEditing = Boolean(id);

  // Get the referrer to know where we came from
  const [referrer, setReferrer] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [languageId, setLanguageId] = useState('');
  const [tags, setTags] = useState('');
  const [organizationType, setOrganizationType] = useState(
    initialFolderId ? 'folder' : initialProjectId ? 'project' : 'none'
  );
  const [folderId, setFolderId] = useState(initialFolderId || '');
  const [projectId, setProjectId] = useState(initialProjectId || '');
  const [folders, setFolders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Store the referrer when component mounts
    setReferrer(document.referrer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [foldersData, projectsData] = await Promise.all([
          folderApi.getAll(),
          projectApi.getAll()
        ]);
        setFolders(foldersData);
        setProjects(projectsData);

        // Debug logs for loaded data and initial context
        console.log('[DEBUG] initialProjectId:', initialProjectId, 'initialFolderId:', initialFolderId);
        console.log('[DEBUG] projects:', projectsData);
        console.log('[DEBUG] folders:', foldersData);

        if(isEditing){
          const snippet = await snippetApi.getById(id);
          setTitle(snippet.title);
          setDescription(snippet.description);
          setCode(snippet.code);
          setLanguageId(String(snippet.language_id));
          setTags((snippet.tags || []).join(', '));
          if (snippet.folder_id) {
            setOrganizationType('folder');
            setFolderId(snippet.folder_id);
          } else if (snippet.project_id) {
            setOrganizationType('project');
            setProjectId(snippet.project_id);
          }
        } 
        else{
          // when creating, preselect folder/project if provided and ensure value is present after data loads
          if (initialFolderId) {
            setOrganizationType('folder');
            const found = foldersData.find(f => f.id === initialFolderId);
            setFolderId(found ? found.id : '');
          } else if (initialProjectId) {
            setOrganizationType('project');
            const found = projectsData.find(p => p.id === initialProjectId);
            setProjectId(found ? found.id : '');
          }
        }
        // Debug logs for state after setting
        setTimeout(() => {
          console.log('[DEBUG] organizationType:', organizationType, 'projectId:', projectId, 'folderId:', folderId);
        }, 500);
      } catch (error) {
        toast.error('Failed to load data', { description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditing, initialFolderId, initialProjectId]);

  const handleOrganizationChange = (type, value) => {
    if (type === 'folder') {
      setFolderId(value);
      setProjectId('');
    } else if (type === 'project') {
      setProjectId(value);
      setFolderId('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!languageId) {
        toast.error('Validation Error', { description: 'Please select a language.' });
        return;
    }
    setLoading(true);

    console.log('[DEBUG] tags input value at submit:', tags);

    const tagArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);

    const snippetData = {
      title,
      code,
      language_id: parseInt(languageId),
      tags: tagArray,
    };

    if (description && description.trim() !== '') {
      snippetData.description = description;
    }

    if (organizationType === 'folder' && folderId) {
      snippetData.folder_id = folderId;
      snippetData.project_id = null;
    } else if (organizationType === 'project' && projectId) {
      snippetData.project_id = projectId;
      snippetData.folder_id = null;
    } else {
      snippetData.folder_id = null;
      snippetData.project_id = null;
    }

    // Debug log for payload
    console.log('[DEBUG] handleSubmit organizationType:', organizationType, 'projectId:', projectId, 'folderId:', folderId);
    console.log('[DEBUG] snippetData payload:', snippetData);

    try {
      if (isEditing) {
        await snippetApi.update(id, snippetData);
        toast.success('Snippet updated successfully!');
      } else {
        await snippetApi.create(snippetData);
        toast.success('Snippet created successfully!');
        // Redirect to folder/project if context exists, else all snippets
        if (organizationType === 'folder' && folderId) {
          navigate(`/dashboard/folders/${folderId}`);
        } else if (organizationType === 'project' && projectId) {
          navigate(`/dashboard/projects/${projectId}`);
        } else {
          navigate('/dashboard/snippets');
        }
        return;
      }
      // For edit, fallback to all snippets
      navigate('/dashboard/snippets');
    } catch (error) {
      toast.error('Failed to save snippet', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const selectedLanguageSlug = languages.find(lang => lang.id === parseInt(languageId))?.slug || 'plaintext';

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{isEditing ? 'Edit Snippet' : 'Create New Snippet'}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter snippet title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language *</Label>
            <Select value={languageId} onValueChange={setLanguageId}>
              <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.id} value={String(lang.id)}>{lang.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the snippet" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="Enter tags separated by commas"
          />
          <p className="text-xs text-muted-foreground">Separate multiple tags with commas (e.g., react, hooks, javascript)</p>
        </div>
        <div className="space-y-4">
          <Label>Organization</Label>
          <Tabs 
            value={organizationType} 
            onValueChange={
              initialFolderId || initialProjectId ? undefined : setOrganizationType
            }
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="none" disabled={!!(initialFolderId || initialProjectId)}>None</TabsTrigger>
              <TabsTrigger value="folder" disabled={!!initialFolderId}>Folder</TabsTrigger>
              <TabsTrigger value="project" disabled={!!initialProjectId}>Project</TabsTrigger>
            </TabsList>
            <TabsContent value="folder" className="mt-4">
              <Select 
                value={folderId} 
                onValueChange={initialFolderId ? undefined : (value) => handleOrganizationChange('folder', value)}
                disabled={!!initialFolderId}
              >
                <SelectTrigger><SelectValue placeholder="Select a folder" /></SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (<SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>))}
                </SelectContent>
              </Select>
              {initialFolderId && folderName && (
                <div className="mt-2 text-sm text-muted-foreground">Selected Folder: <span className="font-semibold">{folderName}</span></div>
              )}
            </TabsContent>
            <TabsContent value="project" className="mt-4">
              <Select 
                value={projectId} 
                onValueChange={initialProjectId ? undefined : (value) => handleOrganizationChange('project', value)}
                disabled={!!initialProjectId}
              >
                <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (<SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>))}
                </SelectContent>
              </Select>
              {initialProjectId && projectName && (
                <div className="mt-2 text-sm text-muted-foreground">Selected Project: <span className="font-semibold">{projectName}</span></div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code *</Label>
          <div className="border rounded-md overflow-hidden">
            <MonacoEditor
              height="400px"
              language={selectedLanguageSlug}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={code}
              onChange={(value) => setCode(value || '')}
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
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : (isEditing ? 'Update Snippet' : 'Create Snippet')}</Button>
        </div>
      </form>
    </div>
  )
}