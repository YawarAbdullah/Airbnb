const express = require('express');
const router = express.Router();
const Listing = require('../models/listing');
const User = require('../models/user');
const { isLoggedIn } = require('../middleware');

router.post('/cart/:id/add', isLoggedIn, async (req, res) => {
    const listingId = req.params.id;
    const user = await User.findById(req.user._id);
    
    if (!user.cart.includes(listingId)) {
        user.cart.push(listingId);
        await user.save();
        req.flash('success', 'Added to cart!');
    } else {
        req.flash('error', 'Already in cart!');
    }

    res.redirect(`/listings/${listingId}`);
});

router.get('/cart', isLoggedIn, async (req, res) => {
    const user = await User.findById(req.user._id).populate('cart');
    res.render('cart/show', { cartItems: user.cart });
});

module.exports = router;
