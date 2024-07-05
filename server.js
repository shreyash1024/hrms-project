const mongoose = require('mongoose')
const dotenv = require('dotenv')
const cron = require('node-cron');

const app = require('./app')
const cronJob = require('./src/controllers/cronJobController');

dotenv.config({ path: './config.env' })

const DB = process.env.DATABASE
mongoose.connect(DB).then(() => {
    console.log(`DB connected successfully`);
    const port = process.env.PORT
    app.listen(port, () => {
        console.log(`Application running on port ${port}`)
    })
})

cron.schedule('0 0 0 * * *', () => {
    cronJob.dailyCronJob();
});

cron.schedule('30 0 0 1 1 *', () => {
    cronJob.resetYearlyLeaves();
});