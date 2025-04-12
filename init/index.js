const mongoose = require("mongoose");
const initdata = require("./data.js");
const Listing = require("../models/listing.js");
 
const MONGO_URL = "mongodb://127.0.0.1:27017/Airbnb";

main().then(() => {
    console.log("connected to DB");
}).catch(err => {
    console.log(err);
});

async function main () {
    await mongoose.connect(MONGO_URL);
} 

const initDB = async () => {
    await Listing.deleteMany({});
    initdata.data = initdata.data.map((obj) => ({...obj, owner: "67e3c20e902c53cbcc1a1225",}));
    await Listing.insertMany(initdata.data);
    console.log("data was initialize");
}

initDB();