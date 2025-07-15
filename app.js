if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const ExpressError = require("./utils/ExpressError");
const listingRouter = require("./routes/listing");
const reviewRouter = require("./routes/review");
const userRouter = require("./routes/user");
const cartRouter = require("./routes/cart");
const bookingRouter = require("./routes/booking");
const User = require("./models/user");

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/airbnb";

// Connect to MongoDB
async function main() {
    await mongoose.connect(dbUrl);
}
main()
    .then(() => console.log("✅ Connected to DB"))
    .catch((err) => console.error("❌ DB Connection Error:", err));

// View Engine Setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Session Store Setup
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET || "thisshouldbeabettersecret",
    },
    touchAfter: 24 * 3600,
});
store.on("error", (e) => console.log("❌ SESSION STORE ERROR", e));

const sessionOptions = {
    store,
    secret: process.env.SECRET || "thisshouldbeabettersecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
};
app.use(session(sessionOptions));
app.use(flash());

// Passport Configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Global Middleware for Flash & Current User
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// Search Route
app.get("/search", async (req, res) => {
    const query = req.query.q;
    const Listing = require("./models/listing");
    const results = query
        ? await Listing.find({ title: { $regex: query, $options: "i" } })
        : [];
    res.render("searchResults", { results, query });
});

// Use Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/", cartRouter);
app.use("/", bookingRouter);

// Catch-all 404 Handler
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

// Error Handler
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    const message = err.message || "Something Went Wrong!";
    console.error("💥 ERROR:", err.stack);
    res.status(statusCode).render("error.ejs", { message });
});

// Start Server
app.listen(8080, () => {
    console.log("🚀 Server is running on port 8080");
});
