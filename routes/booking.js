const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const { isLoggedIn } = require("../middleware");

// Book a room
router.post("/book/:id", isLoggedIn, async (req, res) => {
  try {
    const { checkIn, checkOut, adults, children } = req.body;

    await Booking.create({
      user: req.user._id,
      listing: req.params.id,
      checkIn,
      checkOut,
      adults,
      children
    });

    req.flash("success", "Your room has been booked successfully!");
    res.redirect(`/listings/${req.params.id}`); // ✅ Stay on listing page
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong while booking.");
    res.redirect(`/listings/${req.params.id}`);
  }
});

// Cancel a booking
router.delete("/book/:id", isLoggedIn, async (req, res) => {
  await Booking.findByIdAndDelete(req.params.id);
  req.flash("success", "Booking cancelled.");
  res.redirect("/dashboard");
});

module.exports = router;
