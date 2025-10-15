import cron from "node-cron"
import reportService from "../services/report.service.js"

// Works one time daily at 12 PM 0 0 0 s m h 
const dailySalesReportJob = cron.schedule("0 0 0 * * *", async function () { 
    console.log("Cron Job Daily Task 1: Triggering Daily Sales Report...")

    await reportService.generateDailySalesReport();
}, {
    scheduled:true,
    timezone:"Africa/Cairo"
    }
)

export default dailySalesReportJob;