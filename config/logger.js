import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Ensure logs directory and error.log file exist
const logDir = path.dirname('logs/error.log');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}
if (!fs.existsSync('logs/error.log')) {
    fs.writeFileSync('logs/error.log', '');
}

export default winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log' })
    ]
});