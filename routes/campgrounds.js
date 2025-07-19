import { Router } from 'express';
import { saveImageToMemory } from '../cloudinary.js';
// import { campgroundCreateBruteForce } from '../utils/expressBrute.js';
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

const router = Router();

router.route('/').get(index).post(
  isLoggedIn,
  saveImageToMemory.array('image', 3),
  validateCampground,
  // campgroundCreateBruteForce.prevent,
  createCampground
);

router.get('/new', isLoggedIn, renderNewForm);

router
  .route('/:id')
  .get(isValidCampgroundID, showCampground)
  .put(
    isLoggedIn,
    isValidCampgroundID,
    isCampAuthorOrAdmin,
    saveImageToMemory.array('image', 3),
    validateImageCount,
    validateCampground,
    updateCampground
  )
  .delete(
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
