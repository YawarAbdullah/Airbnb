const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { isLoggedIn } = require("../middleware");

router.post("/book/:id", isLoggedIn, async (req, res) => {
    const { checkIn, checkOut, adults, children } = req.body;

    await Booking.create({
        user: req.user._id,
        listing: req.params.id,
        checkIn: checkIn || new Date(), // default just in case
        checkOut: checkOut || new Date(),
        adults: adults || 1,
        children: children || 0
    });

    req.flash("success", "Room booked successfully!");
    res.redirect("/dashboard");
});
router.delete("/book/:id", isLoggedIn, async (req, res) => {
  await Booking.findByIdAndDelete(req.params.id);
  req.flash("success", "Booking cancelled.");
  res.redirect("/dashboard");
});

module.exports = router;
