import express from 'express';
import router from './src/router.js';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json' with { type: 'json' };

const app = express();

// strict: false lets bodies like "text" or 42 parse, so the object check below
// can reject them with the right message instead of a JSON parse error.
app.use(express.json({ strict: false }));

// POST and PUT bodies must be JSON objects. 
app.use((req, res, next) => {
    const needsBody = req.method === 'POST' || req.method === 'PUT';
    const isObject = typeof req.body === 'object' && req.body !== null && !Array.isArray(req.body);

    if (needsBody && !isObject) {
        return res.status(400).json({ message: 'Request body must be a JSON object' });
    }

    return next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(router);

app.get('/', (req, res) => {
    return res.status(200).json({ message: 'Server is running' });
});

// Use Express middleware for error handling
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Request body must be valid JSON' });
    }

    console.error(`${req.method} ${req.path} failed:`, err.message);
    return res.status(500).json({ message: 'Internal server error' });
});

export default app;
