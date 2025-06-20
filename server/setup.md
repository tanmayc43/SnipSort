# SnipSort Express Server Setup

## Prerequisites

1. **PostgreSQL**: Install PostgreSQL locally
2. **Node.js**: Version 16 or higher
3. **npm**: Comes with Node.js

## Database Setup

1. **Create Database**:
   ```bash
   createdb snipsort
   ```

2. **Run Migrations**:
   ```bash
   # Run the original Supabase migration first
   psql -d snipsort -f ../supabase/migrations/20250617115554_cold_lodge.sql
   
   # Then run the Express-specific migrations
   psql -d snipsort -f migrations/001_create_auth_table.sql
   psql -d snipsort -f migrations/002_update_profiles_table.sql
   psql -d snipsort -f migrations/003_update_foreign_keys.sql
   ```

## Environment Setup

1. **Copy Environment File**:
   ```bash
   cp .env.example .env
   ```

2. **Update .env** with your database credentials:
   ```env
   DB_USER=your_postgres_user
   DB_HOST=localhost
   DB_NAME=snipsort
   DB_PASSWORD=your_postgres_password
   DB_PORT=5432
   JWT_SECRET=your-super-secret-jwt-key-here
   ```

## Installation & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Start Production Server**:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Snippets
- `GET /api/snippets` - Get all snippets (with search, filter, sort)
- `GET /api/snippets/:id` - Get single snippet
- `POST /api/snippets` - Create snippet
- `PUT /api/snippets/:id` - Update snippet
- `DELETE /api/snippets/:id` - Delete snippet
- `POST /api/snippets/:id/tags` - Update snippet tags

### Folders
- `GET /api/folders` - Get all folders
- `POST /api/folders` - Create folder
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## Testing

Test the API using curl or Postman:

```bash
# Health check
curl http://localhost:3001/api/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```