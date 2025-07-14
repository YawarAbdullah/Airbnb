if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override"); // ✅ Only one import
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const cartRouter = require("./routes/cart");
const bookingRouter = require("./routes/booking");

// ❌ REMOVE THIS LINE (already declared above)
// const methodOverride = require("method-override");

app.use(methodOverride("_method"));

const dbUrl = process.env.ATLASDB_URL;

// Connect to MongoDB
async function main() {
    await mongoose.connect(dbUrl);
}
main().then(() => {
    console.log("connected to DB");
}).catch(err => {
    console.log(err);
});

// Template engine and views setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(
