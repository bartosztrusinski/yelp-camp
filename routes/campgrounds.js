import { Router } from 'express';
import { saveImageToMemory } from '../cloudinary.js';
import {
  index,
  createCampground,
  renderNewForm,
  showCampground,
  updateCampground,
  destroyCampground,
  renderEditForm,
} from '../controllers/campgrounds.js';
import {
  isLoggedIn,
  isCampAuthorOrAdmin,
  validateCampground,
  validateImageCount,
  isValidCampgroundID,
} from '../middleware.js';
import { contentLimiter } from '../utils/rateLimit.js';

const router = Router();

router
  .route('/')
  .get(index)
  .post(
    contentLimiter('create a campground'),
    isLoggedIn,
    saveImageToMemory.array('image', 3),
    validateCampground,
    createCampground
  );

router.get('/new', isLoggedIn, renderNewForm);

router
  .route('/:id')
  .get(isValidCampgroundID, showCampground)
  .put(
    contentLimiter('update a campground'),
    isLoggedIn,
    isValidCampgroundID,
    isCampAuthorOrAdmin,
    saveImageToMemory.array('image', 3),
    validateImageCount,
    validateCampground,
    updateCampground
  )
  .delete(
    contentLimiter('delete a campground'),
    isLoggedIn,
    isValidCampgroundID,
    isCampAuthorOrAdmin,
    destroyCampground
  );

router.get(
  '/:id/edit',
  isLoggedIn,
  isValidCampgroundID,
  isCampAuthorOrAdmin,
  renderEditForm
);

export default router;
