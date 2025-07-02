import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

import SnippetCard from '@/components/snippets/SnippetCard';
import { snippetApi } from '@/lib/api';
import { UserAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

// can do filtering with a static list of languages, similar to the editor or can make an api for the same
// need to figure out 
const LANGUAGES = [
    { value: 'JavaScript', label: 'JavaScript' },
    { value: 'Python', label: 'Python' },
    { value: 'SQL', label: 'SQL' },
    // more languages can be added here
];

export default function AllSnippets() {
  const { session, loading: authLoading } = UserAuth();
  const [snippets, setSnippets] = useState([]);
  const [filteredSnippets, setFilteredSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [languageFilter, setLanguageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated_at');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9); // default desktop

  // Responsive page size
  useEffect(() => {
    function updatePageSize() {
      if (window.innerWidth < 640) setPageSize(4); // mobile
      else if (window.innerWidth < 1024) setPageSize(6); // tablet
      else setPageSize(9); // desktop
    }
    updatePageSize();
    window.addEventListener('resize', updatePageSize);
    return () => window.removeEventListener('resize', updatePageSize);
  }, []);

  const totalPages = Math.ceil(filteredSnippets.length / pageSize);
  const paginatedSnippets = filteredSnippets.slice((page - 1) * pageSize, page * pageSize);

  const loadSnippets = useCallback(async () => {
    // if not authenticated, clear snippets and return
    if(authLoading || !session){
      if(!authLoading){
        setSnippets([]);
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try{
      const data = await snippetApi.getAll();
      setSnippets(data);
    }
    catch(error){
      toast.error('Error loading snippets', { description: error.message });
    }
    finally{
      setLoading(false);
    }
  }, [session, authLoading]);

  useEffect(() => {
    loadSnippets();
  }, [loadSnippets]);

  useEffect(() => {
    let filtered = [...snippets];
    // need to improve this
    if(searchQuery.trim()){
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query)) ||
        (s.tags && s.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    if(languageFilter !== 'all'){
      filtered = filtered.filter(s => s.language_name === languageFilter);
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(s => s.is_favorite);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title': return a.title.localeCompare(b.title);
        case 'language': return (a.language_name || '').localeCompare(b.language_name || '');
        case 'created_at': return new Date(b.created_at) - new Date(a.created_at);
        case 'updated_at': default: return new Date(b.updated_at) - new Date(a.updated_at);
      }
    });

    setFilteredSnippets(filtered);
  }, [snippets, searchQuery, languageFilter, sortBy, showFavoritesOnly]);

  useEffect(() => {
    setPage(1); // Reset to first page when filters change
  }, [searchQuery, languageFilter, sortBy, showFavoritesOnly, pageSize]);

  const handleDelete = async (snippetId) => {
    const originalSnippets = snippets;  
    setSnippets(prev => prev.filter(s => s.id !== snippetId)); // optimistic delete
    try{
      await snippetApi.delete(snippetId);
      toast.success('Snippet deleted successfully');
    }
    catch(error){
      toast.error('Error deleting snippet', { description: error.message });
      setSnippets(originalSnippets); // revert to original state
    }
  };

  const handleToggleFavorite = async (snippetId, isCurrentlyFavorite) => {
    const newFavoriteStatus = !isCurrentlyFavorite;
    console.log('[DEBUG] handleToggleFavorite called with snippetId:', snippetId, 'isCurrentlyFavorite:', isCurrentlyFavorite, 'newFavoriteStatus:', newFavoriteStatus);
    setSnippets(prev => prev.map(s => (s.id === snippetId ? { ...s, is_favorite: newFavoriteStatus } : s)));
    try{
      await snippetApi.update(snippetId, { is_favorite: !isCurrentlyFavorite });
      console.log('[DEBUG] API call successful, state updated');
    }
    catch(error){
      console.error('[DEBUG] API call failed, reverting state:', error);
      toast.error('Error updating favorite status', { description: error.message });
      setSnippets(prev => prev.map(s => (s.id === snippetId ? { ...s, is_favorite: isCurrentlyFavorite } : s))); // revert change
    }
  };

  // Callback to update main state when favorite is toggled from SnippetCard
  const onFavoriteToggled = (snippetId, newFavoriteStatus) => {
    console.log('[DEBUG] onFavoriteToggled called with snippetId:', snippetId, 'newFavoriteStatus:', newFavoriteStatus);
    setSnippets(prev => prev.map(s => (s.id === snippetId ? { ...s, is_favorite: newFavoriteStatus } : s)));
  };

  if(loading || authLoading){
    return(
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col space-y-3 p-4 border rounded-lg"><Skeleton className="h-24 w-full rounded-xl" /></div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search snippets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Button
          variant={showFavoritesOnly ? "default" : "outline"}
          className="flex items-center"
          onClick={() => setShowFavoritesOnly((v) => !v)}
          aria-pressed={showFavoritesOnly}
        >
          <Star className={`h-4 w-4 mr-2 ${showFavoritesOnly ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          Favorites
        </Button>
        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filter by language" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {LANGUAGES.map((lang) => (<SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="updated_at">Last Updated</SelectItem>
            <SelectItem value="created_at">Date Created</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="language">Language</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 flex flex-col">
        {filteredSnippets.length === 0 ? (
          <div className="text-center py-12 flex-1 flex flex-col justify-center">
            <h3 className="text-lg font-semibold mb-2">No Snippets Found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or create a new snippet.</p>
            <Button asChild><Link to="/dashboard/snippet/new"><Plus className="h-4 w-4 mr-2" />Create Snippet</Link></Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
              {paginatedSnippets.map((snippet) => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  onDelete={handleDelete}
                  onToggleFavorite={() => handleToggleFavorite(snippet.id, snippet.is_favorite)}
                  onFavoriteToggled={onFavoriteToggled}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={e => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }}
                  aria-disabled={page === 1}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={page === i + 1}
                    onClick={e => { e.preventDefault(); setPage(i + 1); }}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={e => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }}
                  aria-disabled={page === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}