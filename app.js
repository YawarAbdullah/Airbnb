// Edited app.js to fix deployment error

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError");
const listingRouter = require("./routes/listing");
const reviewRouter = require("./routes/review");
const userRouter = require("./routes/user");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const cartRouter = require("./routes/cart");
const bookingRouter = require("./routes/booking");

const dbUrl = process.env.ATLASDB_URL;

main().then(() => {
    console.log("connected to DB");
}).catch(err => {
    console.log(err);
});

async function main() {
    await mongoose.connect(dbUrl);
}

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log("SESSION STORE ERROR", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET || "thisshouldbeabettersecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// 🔍 Log every request
app.use((req, res, next) => {
    console.log("🔍 Incoming Request:", req.method, req.path);
    next();
});

// Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/", cartRouter);
app.use("/", bookingRouter);

// Redirect home to listings
app.get("/", (req, res) => {
    res.redirect("/listings");
});

// Catch-all route for 404
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

// ✅ Updated Error Handler
app.use((err, req, res, next) => {
    console.error("💥 ERROR STACK:", err?.stack || err);
    const status = err.statusCode || 500;
    const message = err.message || "Something Went Wrong!";
    res.status(status).send(`<h1>ERROR</h1><pre>${message}</pre>`);
});

// Start server
app.listen(8080, () => {
    console.log("Server is listening");
});
