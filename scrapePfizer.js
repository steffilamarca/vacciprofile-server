import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import browsers from './browsers.js';

const app = express();
const port = 5000;

function getRandomBrowser() {
    return browsers[Math.floor(Math.random() * browsers.length)];
}

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/api/vaccines', async (req, res) => {
    try {
        const browserConfig = getRandomBrowser();
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setUserAgent(browserConfig.userAgent);
        await page.goto('https://www.pfizer.com/products/product-list', { waitUntil: 'networkidle2' });

        // const getVaccineDetails = async (link) => {
        //     let description = 'Error fetching vaccine details';
        //     try {
        //         const browser = await puppeteer.launch({ headless: true });
        //         const vaccinePage = await browser.newPage();
                
        //         vaccinePage.on('console', msg => console.log('PAGE LOG:', msg.text()));
                
        //         await vaccinePage.goto(link, { waitUntil: 'networkidle2' });
                
        //         const href = await vaccinePage.evaluate(() => {
        //             const linkElement = document.querySelector('ul.product-ct__links a');
        //             return linkElement ? linkElement.getAttribute('href') : null;
        //         });
        
        //         if (href) {
        //             await vaccinePage.goto(href, { waitUntil: 'networkidle2' });
        
        //             description = await vaccinePage.evaluate(() => {
        //                 const descriptionElement = document.querySelector('div.Section div.Section p.First span.XmChange');
        //                 return descriptionElement ? descriptionElement.innerText.trim() : 'No description available';
        //             });
        //         } else {
        //             description = `Prescribing Information link not found ${href}`;
        //         }
                
        //         await vaccinePage.close();
        //         await browser.close();
        //     } catch (error) {
        //         console.error('Error in getVaccineDetails:', error);
        //     }
        //     return description;
        // };
        
        const vaccines = await page.evaluate(async () => {
            const vaccineElements = Array.from(document.querySelectorAll('li.product-list__results-item'));
            const results = [];

            for (const el of vaccineElements) {
                const aTag = el.querySelector('a');
                const divTag = el.querySelector('div');
                
                if (aTag && (divTag && divTag.innerHTML.toLowerCase().includes('vaccine') || (aTag.title && aTag.title.toLowerCase().includes('vaccine')))) {
                    const link = aTag.href;
                    results.push({
                        vaccineName: aTag.title ? aTag.title.trim() : aTag.innerHTML.trim(),
                        link,
                    });
                }
            }

            return results;
        });

        // for (const vaccine of vaccines) {
        //     console.log("vaccine.link: ", vaccine.link)
        //     vaccine.description = await getVaccineDetails(vaccine.link);
        // }

        await browser.close();
        res.json(vaccines);
    } catch (error) {
        console.error('Error fetching vaccines:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
