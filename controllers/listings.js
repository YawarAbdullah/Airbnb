const Listing = require("../models/listing.js");

// ✅ Show all listings
module.exports.index = async (req, res) => {
    const listings = await Listing.find({});
    res.render("listings/index", { listings });
};

// ✅ Render New Form
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

// ✅ Show Listing
module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings"); // ✅ Added return
    }
    res.render("listings/show.ejs", { listing });
};

// ✅ Create New Listing
module.exports.createListing = async (req, res, next) => {
    try {
        if (!req.file) {
            req.flash("error", "Image upload failed!");
            return res.redirect("/listings/new");
        }
        const { path: url, filename } = req.file;

        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = { url, filename };

        await newListing.save();
        req.flash("success", "New Listing Created!");
        res.redirect(`/listings/${newListing._id}`);
    } catch (err) {
        next(err);
    }
};

// ✅ Render Edit Form
module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings"); // ✅ Added return
    }

    // ✅ Correct Cloudinary URL Transformation
    let originalImageUrl = listing.image.url.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// ✅ Update Listing
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

    if (req.file) {
        const { path: url, filename } = req.file;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

// ✅ Delete Listing
module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
