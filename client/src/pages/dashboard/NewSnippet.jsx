import SnippetEditor from '@/components/snippets/SnippetEditor'
import { useLocation } from 'react-router-dom'

export default function NewSnippet() {
  const location = useLocation();
  console.log('[DEBUG] NewSnippet location.state:', location.state);
  const { folderId, folderName, projectId, projectName } = location.state || {};
  return <SnippetEditor 
    folderId={folderId} 
    folderName={folderName} 
    projectId={projectId} 
    projectName={projectName} 
  />;
}