import express from "express";
import reportController from "../controllers/api/report/report.controller.js"; 


const reportRouter = express.Router();

//for getting the last thirty reports
reportRouter.get("/thirtyDays", 

    // protect, 
    // restrictTo("admin"),
    reportController.geLastThirtyDailyReports
);

reportRouter.get("/latest", 
    // protect, 
    // restrictTo("admin"),
    reportController.getLatestReport
);

//by date
reportRouter.get("/:date", 
    // protect, 
    // restrictTo("admin"),
    reportController.DailyReport
);

export default reportRouter;