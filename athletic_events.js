const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const URL = 'https://denverpioneers.com'; // Change to actual scoreboard URL

async function scrapeAthleticEvents() {
    try {
        const { data } = await axios.get(URL);
        const $ = cheerio.load(data);

        const events = [];

        $('.c-scoreboard__item').each((index, element) => {
            const eventDate = $(element).find('.c-scoreboard__date').text().trim();
            const duTeam = $(element).find('.c-scoreboard__sport').text().trim();
            const opponent = $(element).find('.c-scoreboard_team-name').text().trim();

            if (eventDate && duTeam && opponent) {
                events.push({ date: eventDate, duTeam, opponent });
            }
        });

        if (events.length === 0) {
            console.log("No upcoming events found.");
            return;
        }

        // Save output to JSON file
        const outputFilePath = 'results/athletic_events.json';
        fs.writeFileSync(outputFilePath, JSON.stringify({ events }, null, 2));

        console.log(`Scraped ${events.length} events and saved to ${outputFilePath}`);
    } catch (error) {
        console.error("Error fetching DU athletic events:", error.message);
    }
}

// Run the scraper
scrapeAthleticEvents();
