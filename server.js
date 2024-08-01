import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import db from './dbPool.js';
import scrapePfizerVaccineList from './scrapePfizerVaccineList.js';

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

app.get('/api/manufacturers', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM manufacturers');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching manufacturers from database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);

    scrapePfizerVaccineList().then(() => {
        console.log('Initial Pfizer data scraping complete.');
    }).catch(error => {
        console.error('Error running Pfizer initial data scrape:', error);
    });
});

cron.schedule('1 * * * *', () => {
    console.log('Running scheduled scraping jobs...');
    scrapePfizerVaccineList();
});
