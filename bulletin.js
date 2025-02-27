const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

// URL of the DU Bulletin (Update if needed)
const URL = "https://bulletin.du.edu/undergraduate/coursedescriptions/comp/";

// Function to scrape courses
async function scrapeCourses() {
    try {
        // Fetch the page content
        const { data } = await axios.get(URL);
        const $ = cheerio.load(data);

        let courses = [];

        // Select course blocks
        $(".courseblock").each((_, element) => {
            let titleText = $(element).find(".courseblocktitle").text().trim();
            let descText = $(element).find(".courseblockdesc").text().trim();

            if (titleText) {
                // Extract course code, number, and title
                let match = titleText.match(/(COMP)\s+(\d{4})\s+(.+?)\s+\((\d+(-\d+)?)\s+Credit(s)?\)/);
                if (match) {
                    let courseCode = `${match[1]}-${match[2]}`; // Format: COMP-XXXX
                    let courseNumber = parseInt(match[2], 10); // Extract course number
                    let courseTitle = match[3].trim(); // Extract title

                    // Include only upper-division courses (3000+)
                    // and ensure it does not explicitly mention prerequisites
                    if (
                        courseNumber >= 3000 && 
                        !descText.match(/\bPrerequisite(s)?\b/) // Excludes courses explicitly listing prerequisites
                    ) {
                        courses.push({
                            course: courseCode,
                            title: courseTitle,
                        });
                    }
                }
            }
        });

        // Save results in JSON format
        const outputDir = "results";
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

        const outputPath = `${outputDir}/bulletin.json`;
        fs.writeFileSync(outputPath, JSON.stringify({ courses }, null, 4));

        console.log(`✅ Scraped ${courses.length} upper-division courses (3000+ level) with no explicit prerequisites and saved to ${outputPath}`);
    } catch (error) {
        console.error("❌ Error scraping data:", error.message);
    }
}

// Run the scraper
scrapeCourses();
