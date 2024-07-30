import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import db from './db.js';
import scrapePfizer from './scrapePfizer.js';

const app = express();
const port = 5000;

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/api/vaccines', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM vaccines');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching vaccines from database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

cron.schedule('* * * * *', () => {
    console.log('Running scheduled scraping job...');
    scrapePfizer();
});
