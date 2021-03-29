const Campground = require('../models/campground');
const User = require('../models/user');
const {cloudinary} = require('../cloudinary');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({accessToken: mapBoxToken});
const ExpressError = require('../utils/ExpressError');


module.exports.index = async (req, res) => {
    if (!req.query.page) {
        const campgrounds = await Campground.paginate({}, {
            sort: {dateCreated: -1}
        });
        const allCampgrounds = await Campground.find();
        res.render('campgrounds/index', {campgrounds, allCampgrounds});
    } else {
        const {page} = req.query;
        const campgrounds = await Campground.paginate({}, {
            page,
            sort: {dateCreated: -1}
        });
        res.status(200).json(campgrounds);
    }

}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.createCampground = async (req, res) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    const newCampground = new Campground(req.body.campground);
    if (!geoData.body.features[0]) {
        throw new ExpressError('Could not find that place!', 400);
    }
    newCampground.geometry = geoData.body.features[0].geometry;
    newCampground.images = req.files.map(f => ({url: f.path, filename: f.filename}));
    newCampground.author = req.user._id;
    newCampground.price = Math.round((newCampground.price + Number.EPSILON) * 100) / 100;
    const campAuthor = await User.findById(req.user._id);
    campAuthor.campgrounds.push(newCampground);
    await newCampground.save();
    await campAuthor.save();
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/campgrounds/${newCampground._id}`);
}

module.exports.showCampground = async (req, res) => {
    const {id} = req.params;
    const foundCampground = await Campground.findById(id).populate({
        path: 'reviews',
        options: {
            sort: {'dateCreated': -1}
        },
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!foundCampground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', {campground: foundCampground});
}

module.exports.renderEditForm = async (req, res) => {
    const {id} = req.params;
    const foundCampground = await Campground.findById(id);
    if (!foundCampground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', {campground: foundCampground});
}

module.exports.updateCampground = async (req, res) => {
    const {id} = req.params;
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    const newImgs = req.files.map(f => ({url: f.path, filename: f.filename}))

    const updatedCampground = await Campground.findByIdAndUpdate(id, {...req.body.campground});
    if (!geoData.body.features[0]) {
        throw new ExpressError('Could not find that location!', 400);
    }
    updatedCampground.geometry = geoData.body.features[0].geometry;
    updatedCampground.images.push(...newImgs);
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await updatedCampground.updateOne({$pull: {images: {filename: {$in: req.body.deleteImages}}}});
    }
    await updatedCampground.save();
    req.flash('success', 'Successfully updated campground!');
    res.redirect(`/campgrounds/${updatedCampground._id}`);
}

module.exports.destroyCampground = async (req, res) => {
    const {id} = req.params;
    const deletedCampground = await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground!');
    res.redirect('/campgrounds');
}