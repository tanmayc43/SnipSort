// Languages for the code editor
export const languages = [
    { id: 1, name: 'JavaScript', slug: 'javascript' },
    { id: 2, name: 'TypeScript', slug: 'typescript' },
    { id: 3, name: 'Python', slug: 'python' },
    { id: 4, name: 'Java', slug: 'java' },
    { id: 5, name: 'C#', slug: 'csharp' },
    { id: 6, name: 'C++', slug: 'cpp' },
    { id: 7, name: 'C', slug: 'c' },
    { id: 8, name: 'Go', slug: 'go' },
    { id: 9, name: 'Rust', slug: 'rust' },
    { id: 10, name: 'PHP', slug: 'php' },
    { id: 11, name: 'Ruby', slug: 'ruby' },
    { id: 12, name: 'Swift', slug: 'swift' },
    { id: 13, name: 'Kotlin', slug: 'kotlin' },
    { id: 14, name: 'Dart', slug: 'dart' },
    { id: 15, name: 'HTML', slug: 'html' },
    { id: 16, name: 'CSS', slug: 'css' },
    { id: 17, name: 'SQL', slug: 'sql' },
    { id: 18, name: 'Shell', slug: 'shell' },
    { id: 19, name: 'PowerShell', slug: 'powershell' },
    { id: 20, name: 'YAML', slug: 'yaml' },
    { id: 21, name: 'JSON', slug: 'json' },
    { id: 22, name: 'Markdown', slug: 'markdown' },
    { id: 23, name: 'Dockerfile', slug: 'dockerfile' },
    { id: 24, name: 'Plain Text', slug: 'text' }
];

export const LANGUAGE_COLORS = {
  javascript: "#f7df1e",
  typescript: "#3178c6",
  python: "#3572A5",
  java: "#b07219",
  "c++": "#00599c",
  csharp: "#178600",
  php: "#4F5D95",
  ruby: "#701516",
  go: "#00ADD8",
  rust: "#dea584",
  swift: "#ffac45",
  kotlin: "#A97BFF",
  dart: "#00B4AB",
  html: "#e34c26",
  css: "#563d7c",
  scss: "#c6538c",
  sql: "#e38c00",
  json: "#cbcb41",
  yaml: "#cb171e",
  markdown: "#083fa1",
  bash: "#89e051",
  powershell: "#012456",
  dockerfile: "#384d54",
  xml: "#0060ac",
  plaintext: "#999999"
};

// App configuration
export const APP_CONFIG = {
  name: 'SnipSort',
  version: '1.0.0',
  description: 'The ultimate code snippet manager for developers',
  
  // Cache settings
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 100, // Maximum number of cached items
  },
  
  // Pagination
  pagination: {
    defaultPageSize: 12,
    maxPageSize: 50,
    pageSizes: [6, 12, 24, 48]
  },
  
  // File upload limits
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },
  
  // Search
  search: {
    debounceMs: 300,
    minQueryLength: 2,
    maxResults: 50
  },
  
  // UI settings
  ui: {
    animationDuration: 200,
    toastDuration: 5000,
    sidebarWidth: 256,
    headerHeight: 64
  }
};

// User roles and permissions
export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member'
};

export const PERMISSIONS = {
  [USER_ROLES.OWNER]: ['read', 'write', 'delete', 'manage_members', 'manage_project'],
  [USER_ROLES.ADMIN]: ['read', 'write', 'delete', 'manage_members'],
  [USER_ROLES.MEMBER]: ['read']
};

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout'
  },
  snippets: {
    list: '/api/snippets',
    create: '/api/snippets',
    get: (id) => `/api/snippets/${id}`,
    update: (id) => `/api/snippets/${id}`,
    delete: (id) => `/api/snippets/${id}`
  },
  folders: {
    list: '/api/folders',
    create: '/api/folders',
    get: (id) => `/api/folders/${id}`,
    update: (id) => `/api/folders/${id}`,
    delete: (id) => `/api/folders/${id}`
  },
  projects: {
    list: '/api/projects',
    create: '/api/projects',
    get: (id) => `/api/projects/${id}`,
    update: (id) => `/api/projects/${id}`,
    delete: (id) => `/api/projects/${id}`,
    addMember: (id) => `/api/projects/${id}/members`,
    removeMember: (id, memberId) => `/api/projects/${id}/members/${memberId}`
  }
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  SNIPPET_CREATED: 'Snippet created successfully!',
  SNIPPET_UPDATED: 'Snippet updated successfully!',
  SNIPPET_DELETED: 'Snippet deleted successfully!',
  FOLDER_CREATED: 'Folder created successfully!',
  FOLDER_UPDATED: 'Folder updated successfully!',
  FOLDER_DELETED: 'Folder deleted successfully!',
  PROJECT_CREATED: 'Project created successfully!',
  PROJECT_UPDATED: 'Project updated successfully!',
  PROJECT_DELETED: 'Project deleted successfully!',
  MEMBER_ADDED: 'Member added successfully!',
  MEMBER_REMOVED: 'Member removed successfully!',
  COPIED_TO_CLIPBOARD: 'Copied to clipboard!',
  FAVORITE_ADDED: 'Added to favorites!',
  FAVORITE_REMOVED: 'Removed from favorites!'
};

// Theme colors
export const THEME_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#8B5CF6',
  warning: '#F59E0B',
  error: '#EF4444',
  success: '#10B981',
  info: '#3B82F6'
};

// Default colors for folders and projects
export const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6366F1'  // Indigo
];