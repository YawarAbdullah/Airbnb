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
const secret = process.env.SECRET || "thisshouldbeabettersecret";

// ✅ Database Connection
async function main() {
    try {
        await mongoose.connect(dbUrl);
        console.log("✅ Connected to MongoDB");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    }
}
main();

// ✅ EJS Setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// ✅ Session Setup
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: { secret },
    touchAfter: 24 * 3600,
});
store.on("error", (err) => {
    console.log("❌ SESSION STORE ERROR", err);
});

const sessionOptions = {
    store,
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
};

app.use(session(sessionOptions));
app.use(flash());

// ✅ Passport Auth
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ✅ Global Middleware for Flash & User
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// ✅ Home Route (Fix for Render)
app.get("/", (req, res) => {
    res.redirect("/listings");
});

// ✅ Search Route
app.get("/search", async (req, res) => {
    const query = req.query.q?.trim();
    const Listing = require("./models/listing");
    const results = query
        ? await Listing.find({ title: { $regex: query, $options: "i" } })
        : [];
    res.render("searchResults", { results, query });
});

// ✅ Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/", cartRouter);
app.use("/", bookingRouter);

// ✅ 404 Handler
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
    console.error("🔥 ERROR:", err);
    const { statusCode = 500, message = "Something Went Wrong!" } = err;
    res.status(statusCode).render("error.ejs", { message });
});

// ✅ Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
