const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://du.edu/calendar'; // Replace with actual DU calendar URL
const OUTPUT_FILE = path.join(__dirname, 'results', 'calendar_events.json');

async function fetchPage(url) {
    try {
        const { data } = await axios.get(url);
        return cheerio.load(data);
    } catch (error) {
        console.error(`Error fetching URL: ${url}`, error);
        return null;
    }
}

async function scrapeEvents() {
    let events = [];
    let url = `${BASE_URL}?start_date=2025-01-01&end_date=2025-02-01#events-listing-date-filter-anchor`;
    
    while (url) {
        let $ = await fetchPage(url);
        if (!$) break;

        let eventPromises = $('.events-listing__item').map(async (index, element) => {
            let title = $(element).find('h3').text().trim();
            let date = $(element).find('p').first().text().trim();
            let time = $(element).find('.icon-du-clock').parent().text().trim();
            let eventPageUrl = $(element).find('a.event-card').attr('href');
            
            let description = '';
            
            if (eventPageUrl) {
                let eventDetails = await scrapeEventDetails(eventPageUrl);
                description = eventDetails.description;
            }
            
            let event = { title, date };
            if (time) event.time = time;
            if (description) event.description = description;
            
            return event;
        }).get();
        
        events.push(...(await Promise.all(eventPromises)));

        let nextMonthLink = $('a:contains("Next Month")').attr('href');
        if (nextMonthLink) {
            url = BASE_URL + nextMonthLink;
        } else {
            url = null;
        }
    }

    saveEvents(events);
}

async function scrapeEventDetails(eventPageUrl) {
    let $ = await fetchPage(eventPageUrl);
    if (!$) return { description: '' };
    
    let description = $('div[itemprop="description"].description').text().trim() || '';
    
    return { description };
}

function saveEvents(events) {
    if (!fs.existsSync('results')) {
        fs.mkdirSync('results');
    }
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ events }, null, 4));
    console.log(`Events saved to ${OUTPUT_FILE}`);
}

scrapeEvents();
