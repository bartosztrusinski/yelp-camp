const Campground = require('../models/campground');
const User = require('../models/user');
const { cloudinary } = require('../cloudinary');

const index = async (req, res) => {
  if (!req.query.page) {
    await renderFirstPage(res);
  } else {
    await renderPage(req.query.page, res);
  }
};

const renderFirstPage = async (res) => {
  const allCampgrounds = await Campground.find();
  const campgrounds = await Campground.paginate(
    {},
    { sort: { dateCreated: -1 } }
  );

  res.render('campgrounds/index', { campgrounds, allCampgrounds });
};

const renderPage = async (page, res) => {
  const campgrounds = await Campground.paginate(
    {},
    { page, sort: { dateCreated: -1 } }
  );

  res.status(200).json(campgrounds);
};

const renderNewForm = (req, res) => {
  res.render('campgrounds/new');
};

const createCampground = async (req, res) => {
  const currentUser = req.user;
  const newCampground = new Campground(req.body.campground);

  newCampground.geometry = res.locals.geometry;
  newCampground.location = res.locals.location;
  newCampground.author = currentUser._id;
  newCampground.images = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));

  await newCampground.save();
  await associateCampgroundWithUser(currentUser, newCampground);

  req.flash('success', 'Successfully made a new campground!');
  res.redirect(`/campgrounds/${newCampground._id}`);
};

const associateCampgroundWithUser = async (user, camp) => {
  const campAuthor = await User.findById(user._id);
  campAuthor.campgrounds.push(camp);
  await campAuthor.save();
};

const showCampground = async (req, res) => {
  const campground = await res.locals.campground
    .populate({
      path: 'reviews',
      options: { sort: { dateCreated: -1 } },
      populate: { path: 'author' },
    })
    .populate('author')
    .execPopulate();

  res.render('campgrounds/show', { campground });
};

const renderEditForm = async (req, res) => {
  const campground = res.locals.campground;

  res.render('campgrounds/edit', { campground });
};

const updateCampground = async (req, res) => {
  const campground = res.locals.campground;
  const newImages = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));

  await campground.updateOne({ ...req.body.campground });

  campground.geometry = res.locals.geometry;
  campground.location = res.locals.location;
  campground.images.push(...newImages);

  await deleteImagesUserChose(req, campground);
  await campground.save();

  req.flash('success', 'Successfully updated campground!');
  res.redirect(`/campgrounds/${campground._id}`);
};

const deleteImagesUserChose = async (req, camp) => {
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await camp.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
  }
};

const destroyCampground = async (req, res) => {
  const campground = res.locals.campground;
  const user = await User.findById(campground.author);

  if (user) {
    await user.updateOne({ $pull: { campgrounds: campground._id } });
  }

  await campground.remove();

  req.flash('success', 'Successfully deleted campground!');
  res.redirect('/campgrounds');
};

module.exports = {
  index,
  renderNewForm,
  createCampground,
  showCampground,
  renderEditForm,
  updateCampground,
  destroyCampground,
};
