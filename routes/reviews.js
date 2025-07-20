import { Router } from 'express';
import { createReview, destroyReview } from '../controllers/reviews.js';
import {
  validateReview,
  isLoggedIn,
  isReviewAuthorOrAdmin,
  isValidCampgroundID,
  isValidReviewID,
} from '../middleware.js';
import { contentLimiter } from '../utils/rateLimit.js';

const router = Router({ mergeParams: true });

router.post(
  '/',
  contentLimiter('create a review'),
  isLoggedIn,
  isValidCampgroundID,
  validateReview,
  createReview
);

router.delete(
  '/:reviewId',
  contentLimiter('delete a review'),
  isLoggedIn,
  isValidCampgroundID,
  isValidReviewID,
  isReviewAuthorOrAdmin,
  destroyReview
);

export default router;
