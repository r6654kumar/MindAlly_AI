const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODBURL);
        console.log("Successfully connected to database");
    } catch (error) {
        console.error(` Database Connection Error: ${error.message}`);
        process.exit(1);
    }
};
module.exports = connectDB;
