import Home from '../pages/Home';
import Login from '../pages/Login';
import SignUp from '../pages/Signup';
import DashboardLayout from '../components/layout/DashboardLayout';
import AllSnippets from '../pages/dashboard/AllSnippets';
import NewSnippet from '../pages/dashboard/NewSnippet';
import EditSnippet from '../pages/dashboard/EditSnippet';
import SnippetView from '../pages/dashboard/SnippetView';
import Folders from '../pages/dashboard/Folders';
import Projects from '../pages/dashboard/Projects';
import Settings from '../pages/dashboard/Settings';

export const routes = [
  { path: '/', name: 'Home', element: Home },
  { path: '/login', name: 'Login', element: Login },
  { path: '/signup', name: 'Sign Up', element: SignUp },
  {
    path: '/dashboard',
    name: 'Dashboard',
    element: DashboardLayout,
    children: [
      { path: '', element: AllSnippets },
      { path: 'snippets', element: AllSnippets },
      { path: 'snippet/new', element: NewSnippet },
      { path: 'snippet/:id', element: SnippetView },
      { path: 'snippet/:id/edit', element: EditSnippet },
      { path: 'folders', element: Folders },
      { path: 'folders/:id', element: Folders },
      { path: 'projects', element: Projects },
      { path: 'projects/:id', element: Projects },
      { path: 'settings', element: Settings },
    ]
  },
];