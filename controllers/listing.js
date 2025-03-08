const Listing = require("../models/listing");


module.exports.index = async (req, res) => {
    try {
        const { category } = req.query;
        const query = category ? { category } : {};  // Apply filter if category is provided
        const listings = await Listing.find(query);
        
        res.render("listings/index.ejs", { allListings: listings });  // Pass data to EJS view
    } catch (err) {
        res.status(500).json({ message: "Error fetching listings", error: err.message });
    }
};


module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({
        path: "reviews",
        populate: {
            path: "author",
        },
    })
        .populate("owner");
    if (!listing) {
        req.flash("error", "listing you requested for does not exist!");
        res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
   

    try {
        let url = req.file.path;
        let filename = req.file.filename;
        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = {url , filename};
        await newListing.save();
        req.flash("success","New Listing Created!");
        res.redirect("/listings");
        res.status(201).json(newListing);
    } catch (err) {
        console.log("Error saving listing:", err.message);
        res.status(500).json({ message: "Error saving listing", error: err.message });
    }
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "listing you requested for does not exist!");
        res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload","/upload/h_300,w_250");
    res.render("listings/edit.ejs", { listing , originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }
    req.flash("success", "listing updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};

module.exports.searchListings = async (req, res) => {
        const query = req.query.query;
        if (!query) {
            return res.status(400).json({ error: "Search query is required" });
        }
    
        try {
            const listings = await Listing.find({ location: new RegExp(query, "i") }); // Search in MongoDB
            res.json({ listings });
        } catch (error) {
            res.status(500).json({ error: "Server error" });
        }
    };
    
