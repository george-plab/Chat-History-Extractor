import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '50mb' })); // Large limit for chat exports
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        name: 'Chat History Extractor API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /api/health',
            processFile: 'POST /api/process-file',
            processUrl: 'POST /api/process-url',
            export: 'POST /api/export',
            platforms: 'GET /api/platforms',
        },
        privacy: {
            message: 'No data is stored. All processing is temporary and in-memory only.',
            dataRetention: 'none',
        },
    });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Server Error]', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 Chat History Extractor API Server');
    console.log('====================================');
    console.log(`📡 Server running at: http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    console.log('');
    console.log('🔒 Privacy Notice:');
    console.log('   - No data is stored permanently');
    console.log('   - All processing is in-memory only');
    console.log('   - Data is discarded after response');
    console.log('');
});

export default app;
