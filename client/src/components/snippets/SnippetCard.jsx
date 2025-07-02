import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner'; 
import {
  Copy,
  Edit,
  Trash2,
  Star,
  Folder,
  Box, // Using Box for projects
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { snippetApi } from '@/lib/api';
import { LANGUAGE_COLORS } from '@/lib/constants';

export default function SnippetCard({ snippet, onDelete, onToggleFavorite, onFavoriteToggled, readOnly = false }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [fullSnippet, setFullSnippet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (modalOpen) {
      setLoading(true);
      setError(null);
      snippetApi.getById(snippet.id)
        .then(data => {
          setFullSnippet(data);
        })
        .catch(err => {
          setError('Failed to load snippet');
        })
        .finally(() => setLoading(false));
    } else {
      setFullSnippet(null);
      setError(null);
      setLoading(false);
    }
  }, [modalOpen, snippet.id]);

  const handleCopy = async (snippet) => {
    let codeToCopy = snippet.code;
    if(!codeToCopy){
      try{
      const data = await snippetApi.getById(snippet.id);
      codeToCopy = data.code || '';
      }
      catch(error){
        toast.error('Failed to fetch snippet for copying.');
        console.error('Clipboard fetch error: ', error.message)
        return;
      }
    }
    console.log('Copying:', codeToCopy);
    try{
      await navigator.clipboard.writeText(codeToCopy);
      toast.success('Copied to clipboard!');
    } 
    catch(error){
      toast.error('Failed to copy code.');
      console.error('Clipboard error:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this snippet?')) {
      setIsDeleting(true);
      try {
        await onDelete(snippet.id);
        toast.success('Snippet deleted successfully.');
      } catch (error) {
        toast.error('Failed to delete snippet.', { description: error.message });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleToggleFavorite = async () => {
    try{
      // fetching full snippet to ensure all required fields are present
      const full = snippet.code ? snippet : await snippetApi.getById(snippet.id);
      const updatedSnippet = {
        ...full,
        is_favorite: !full.is_favorite,
      };
      // remove fields that shouldn't be sent (like id, created_at, updated_at, etc.)
      const { id, created_at, updated_at, ...payload } = updatedSnippet;
      console.log('[DEBUG] Toggling favorite for snippet:', snippet.id);
      console.log('[DEBUG] Current is_favorite:', full.is_favorite, 'New is_favorite:', updatedSnippet.is_favorite);
      console.log('[DEBUG] Payload sent to API:', payload);
      const response = await snippetApi.update(snippet.id, payload);
      console.log('[DEBUG] API response:', response);
      // Update parent state if callback is provided
      if (onFavoriteToggled) {
        onFavoriteToggled(snippet.id, updatedSnippet.is_favorite);
      }
      toast.success(updatedSnippet.is_favorite ? 'Added to favorites' : 'Removed from favorites');
    } 
    catch (error) {
      console.error('[DEBUG] Error updating favorite status:', error);
      toast.error('Failed to update favorite status.', { description: error.message });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const organizationInfo = (() => {
    const s = fullSnippet || snippet;
    if (s.folder_name) {
      return { name: s.folder_name, icon: Folder };
    }
    if (s.project_name) {
      return { name: s.project_name, icon: Box };
    }
    return null;
  })();

  const langName = (fullSnippet || snippet).language_name || 'Plain Text';
  const langSlug = langName.toLowerCase().replace(/[^a-z0-9+#]+/g, '');
  const langColor = LANGUAGE_COLORS[langSlug] || '#999999';

  // Syntax highlighting (simple fallback, can be replaced with Prism.js/Highlight.js)
  const CodeBlock = ({ code }) => (
    <pre className="bg-muted rounded p-3 overflow-x-auto overflow-y-auto text-xs font-mono mb-2 whitespace-pre-wrap max-h-80">
      {code && code.trim().length > 0 ? code : '// No code available'}
    </pre>
  );

  function getContrastText(bgColor) {
    const color = bgColor.charAt(0) === '#' ? bgColor.substring(1) : bgColor;
    const r = parseInt(color.substr(0,2),16);
    const g = parseInt(color.substr(2,2),16);
    const b = parseInt(color.substr(4,2),16);
    const luminance = (0.299*r + 0.587*g + 0.114*b)/255;
    return luminance > 0.5 ? '#222' : '#fff';
  }

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <div
          className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col cursor-pointer group w-full mb-2 min-h-[110px] lg:min-h-[80px] justify-between"
          style={{ minHeight: 0 }}
          onClick={() => setModalOpen(true)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                {snippet.title}
              </h3>
              {snippet.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {snippet.description}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-1 ml-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleCopy(snippet); }} aria-label="Copy code">
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={e => { e.stopPropagation(); handleToggleFavorite(); }}
                aria-label={((fullSnippet || snippet).is_favorite ? 'Unfavorite' : 'Favorite') + ' snippet'}
              >
                {((fullSnippet || snippet).is_favorite) ? (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ) : (
                  <Star className="h-4 w-4" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!readOnly && (
                    <>
                      <DropdownMenuItem
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {snippet.tags && snippet.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 my-3 flex-grow">
              {snippet.tags.slice(0, 4).map((tag) => {
                const tagSlug = tag.toLowerCase().replace(/[^a-z0-9+#]+/g, '');
                const isLangTag = tagSlug === langSlug;
                return (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                    style={isLangTag ? {
                      backgroundColor: langColor,
                      color: getContrastText(langColor)
                    } : {}}
                  >
                    {tag}
                  </span>
                );
              })}
              {snippet.tags.length > 4 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                  +{snippet.tags.length - 4} more
                </span>
              )}
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3 mt-auto">
            <div className="flex items-center space-x-4">
              <span
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: langColor,
                  color: getContrastText(langColor)
                }}
              >
                {langName}
              </span>
              {organizationInfo && (
                <div className="flex items-center space-x-1">
                  <organizationInfo.icon className="h-3 w-3" />
                  <span className="text-xs">{organizationInfo.name}</span>
                </div>
              )}
            </div>
            <span className="text-xs">{formatDate(snippet.updated_at)}</span>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{(fullSnippet || snippet).title}</DialogTitle>
          <DialogDescription>{(fullSnippet || snippet).description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2 mb-2">
          {(fullSnippet || snippet).tags && (fullSnippet || snippet).tags.map((tag) => (
            <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4 mb-2">
          <span className="bg-muted px-2 py-1 rounded text-xs font-medium">
            {(fullSnippet || snippet).language_name || 'Plain Text'}
          </span>
          {organizationInfo && (
            <div className="flex items-center space-x-1">
              <organizationInfo.icon className="h-3 w-3" />
              <span className="text-xs">{organizationInfo.name}</span>
            </div>
          )}
          <span className="text-xs text-muted-foreground">Last updated: {formatDate((fullSnippet || snippet).updated_at)}</span>
        </div>
        {loading ? (
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        ) : error ? (
          <div className="text-center text-destructive py-8">{error}</div>
        ) : (
          <CodeBlock code={(fullSnippet || snippet).code} />
        )}
        <DialogFooter className="flex-row justify-between">
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" /> Copy
          </Button>
          <Button variant="default" onClick={() => navigate(`/dashboard/snippet/${snippet.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}