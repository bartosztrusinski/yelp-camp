import { Router } from 'express';
// import { reviewCreateBruteForce } from '../utils/expressBrute.js';
import { createReview, destroyReview } from '../controllers/reviews.js';
import {
  validateReview,
  isLoggedIn,
  isReviewAuthorOrAdmin,
  isValidCampgroundID,
  isValidReviewID,
} from '../middleware.js';

const router = Router({ mergeParams: true });

router.post(
  '/',
  isLoggedIn,
  isValidCampgroundID,
  validateReview,
  // reviewCreateBruteForce.prevent,
  createReview
);

router.delete(
  '/:reviewId',
  isLoggedIn,
  isValidCampgroundID,
  isValidReviewID,
  isReviewAuthorOrAdmin,
  destroyReview
);

export default router;
