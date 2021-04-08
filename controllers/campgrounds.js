const Campground = require('../models/campground')
    , User = require('../models/user')
    , {cloudinary} = require('../cloudinary');


module.exports.index = async(req, res) => {
    if(!req.query.page) {
        await renderFirstPage(res);
    } else {
        const {page} = req.query;
        await renderPage(page, res);
    }
}

const renderFirstPage = async(res) => {
    const campgrounds = await Campground.paginate({}, {
        sort: {dateCreated: -1}
    });
    const allCampgrounds = await Campground.find();
    res.render('campgrounds/index', {campgrounds, allCampgrounds});
}

const renderPage = async(page, res) => {
    const campgrounds = await Campground.paginate({}, {
        page,
        sort: {dateCreated: -1}
    });
    res.status(200).json(campgrounds);
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.createCampground = async(req, res) => {
    const currentUser = req.user
        , newCampground = new Campground(req.body.campground);
    newCampground.geometry = res.locals.geometry;
    newCampground.location = res.locals.location;
    newCampground.images = req.files.map(f => ({url: f.path, filename: f.filename}));
    newCampground.author = currentUser._id;
    await newCampground.save();
    await associateCampgroundWithUser(currentUser, newCampground);
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/campgrounds/${newCampground._id}`);
}

const associateCampgroundWithUser = async(user, camp) => {
    const campAuthor = await User.findById(user._id);
    campAuthor.campgrounds.push(camp);
    await campAuthor.save();
}

module.exports.showCampground = async(req, res) => {
    const campground = await res.locals.campground
        .populate({
            path: 'reviews',
            options: {
                sort: {'dateCreated': -1}
            },
            populate: {
                path: 'author'
            }
        })
        .populate('author')
        .execPopulate();
    res.render('campgrounds/show', {campground});
}

module.exports.renderEditForm = async(req, res) => {
    const campground = res.locals.campground;
    res.render('campgrounds/edit', {campground});
}

module.exports.updateCampground = async(req, res) => {
    const newImages = req.files.map(f => ({url: f.path, filename: f.filename}))
        , campground = res.locals.campground;
    await campground.updateOne({...req.body.campground});
    campground.geometry = res.locals.geometry;
    campground.location = res.locals.location;
    campground.images.push(...newImages);
    await deleteImagesUserChose(req, campground);
    await campground.save();
    req.flash('success', 'Successfully updated campground!');
    res.redirect(`/campgrounds/${campground._id}`);
}

const deleteImagesUserChose = async(req, camp) => {
    if(req.body.deleteImages) {
        for(let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await camp.updateOne({$pull: {images: {filename: {$in: req.body.deleteImages}}}});
    }
}

module.exports.destroyCampground = async(req, res) => {
    const campground = res.locals.campground;
    await campground.remove();
    req.flash('success', 'Successfully deleted campground!');
    res.redirect('/campgrounds');
}