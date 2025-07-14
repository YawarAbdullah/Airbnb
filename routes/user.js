const express = require("express");
const Booking = require("../models/booking");

const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");
const { isLoggedIn } = require("../middleware");

router.get("/dashboard", isLoggedIn, async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id }).populate("listing");
    res.render("dashboard", { bookings });
});


router.route("/signup")
    .get(userController.renderSignupForm)
    .post(wrapAsync(userController.signup));

router.route("/login")
    .get(userController.renderLoginForm)
    .post(saveRedirectUrl, passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), userController.login);

router.get("/logout", userController.logout);

module.exports = router;