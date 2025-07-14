const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const Listing = require('../models/listing');
const { isLoggedIn } = require('../middleware');

router.post('/book/:id', isLoggedIn, async (req, res) => {
    const listingId = req.params.id;
    await Booking.create({
        user: req.user._id,
        listing: listingId
    });
    req.flash('success', 'Room booked successfully!');
    res.redirect(`/listings/${listingId}`);
});

module.exports = router;
