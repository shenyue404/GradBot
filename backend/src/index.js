import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection, syncDatabase } from './models/index.js';
import studentRoutes from './routes/student.js';
import topicRoutes from './routes/topic.js';
import taskBookRoutes from './routes/taskBook.js';
import proposalRoutes from './routes/proposal.js';
import midtermRoutes from './routes/midterm.js';
import reviewRoutes from './routes/review.js';
import databaseRoutes from './routes/database.js';
import authRoutes from './routes/auth.js';
import teacherRoutes from './routes/teacher.js';
import adminRoutes from './routes/admin.js';
import { testAiConnection, isAiConfigured } from './services/aiService.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'GradBot backend is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health/ai', async (req, res) => {
  const result = await testAiConnection();
  res.status(result.ok ? 200 : 503).json({
    success: result.ok,
    configured: isAiConfigured(),
    ...result,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Test endpoint working' });
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/taskbooks', taskBookRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/midterms', midtermRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/database', databaseRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Server error.',
    error: err.message,
  });
});

async function startServer() {
  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed.');
    }

    if (process.env.NODE_ENV !== 'production') {
      const synced = await syncDatabase(false);
      if (!synced) {
        throw new Error('Database sync failed.');
      }
    }

    app.listen(PORT, () => {
      console.log(`GradBot backend listening on port ${PORT}.`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer();
