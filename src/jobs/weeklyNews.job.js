import cron from "node-cron";

import sendWeeklyNewsService from "../services/news.service.js";

const weeklyNewsJob = cron.schedule('0 8 * * 5', () => {
    console.log('CRON Task 3: Triggering weekly news...');

    sendWeeklyNewsService();
}, {
    scheduled: true,
    timezone: "Africa/Cairo"
});

export default weeklyNewsJob;