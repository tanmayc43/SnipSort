const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/database');

const authRoutes = require('./routes/auth');
const snippetRoutes = require('./routes/snippets');
const folderRoutes = require('./routes/folders');
const projectRoutes = require('./routes/projects');

const app = express();

app.use(cors({ 
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/projects', projectRoutes);

// testing the database connection before starting the server
const startServer = async () => {
  try {
      const client = await pool.connect();
      console.log('Database connected successfully!');
      client.release(); // releasing the client back to the pool

      const PORT = process.env.PORT || 3001;
      app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
      });
    }
    catch(error){
      console.error('Failed to connect to the database.');
      console.error(error.message);
      process.exit(1);
    }
};

startServer();