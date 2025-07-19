import { Campground } from '../models/campground.js';
import { User } from '../models/user.js';
import { cloudinary, uploadImageFromMemory } from '../cloudinary.js';

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
  const uploadPromises = req.files.map(uploadImageFromMemory);
  const uploadResults = await Promise.all(uploadPromises);

  newCampground.images = uploadResults.map(({ secure_url, public_id }) => ({
    url: secure_url,
    filename: public_id,
  }));
  newCampground.geometry = res.locals.geometry;
  newCampground.location = res.locals.location;
  newCampground.author = currentUser._id;

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
  const campground = await res.locals.campground.populate([
    {
      path: 'reviews',
      options: { sort: { dateCreated: -1 } },
      populate: { path: 'author' },
    },
    'author',
  ]);

  res.render('campgrounds/show', { campground });
};

const renderEditForm = async (req, res) => {
  const campground = res.locals.campground;

  res.render('campgrounds/edit', { campground });
};

const updateCampground = async (req, res) => {
  const campground = res.locals.campground;
  const pictureFiles = req.files;
  const picturesToDelete = req.body.deleteImages;

  const uploadPromises = pictureFiles.map(uploadImageFromMemory);

  const uploadResults = await Promise.all(uploadPromises);
  const newImages = uploadResults.map(({ secure_url, public_id }) => ({
    url: secure_url,
    filename: public_id,
  }));

  await campground.updateOne({ ...req.body.campground });

  campground.images.push(...newImages);
  campground.geometry = res.locals.geometry;
  campground.location = res.locals.location;

  if (picturesToDelete) {
    await deletePictures(picturesToDelete, campground);
  }

  await campground.save();

  req.flash('success', 'Successfully updated campground!');
  res.redirect(`/campgrounds/${campground._id}`);
};

const deletePictures = async (picturesToDelete, campground) => {
  for (let filename of picturesToDelete) {
    await cloudinary.uploader.destroy(filename);
  }

  await campground.updateOne({
    $pull: { images: { filename: { $in: picturesToDelete } } },
  });
};

const destroyCampground = async (req, res) => {
  const campground = res.locals.campground;
  const user = await User.findById(campground.author);

  if (user) {
    await user.updateOne({ $pull: { campgrounds: campground._id } });
  }

  await campground.deleteOne();

  req.flash('success', 'Successfully deleted campground!');
  res.redirect('/campgrounds');
};

export {
  index,
  renderNewForm,
  createCampground,
  showCampground,
  renderEditForm,
  updateCampground,
  destroyCampground,
};
