import 'dotenv/config';

import path from 'path';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import helmet from 'helmet';
import engine from 'ejs-mate';
import methodOverride from 'method-override';
import flash from 'connect-flash';
import { RedisStore } from 'connect-redis';
import passport from 'passport';
import LocalStrategy from 'passport-local';

import { User } from './models/user.js';
import { redisClient } from './redis.js';
import { deleteUploadedImages } from './cloudinary.js';
import { globalLimiter } from './utils/rateLimit.js';
import {
  scriptSrcUrls,
  styleSrcUrls,
  connectSrcUrls,
  fontSrcUrls,
} from './allowedUrls.js';

import campgroundRoutes from './routes/campgrounds.js';
import reviewRoutes from './routes/reviews.js';
import userRoutes from './routes/users.js';
import contactRoutes from './routes/contacts.js';

mongoose
  .connect(process.env.DB_URL, { sanitizeFilter: true })
  .catch((err) => console.error('MongoDB connection error:', err));
mongoose.connection.on('error', (err) => console.error('MongoDB error:', err));
mongoose.connection.once('open', () => console.log('Connected to MongoDB'));

const app = express();

app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(import.meta.dirname, 'views'));

app.use(express.static(path.join(import.meta.dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser(process.env.SECRET));

const sessionConfig = {
  name: 'session',
  secret: process.env.SECRET,
  resave: true,
  rolling: true,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false },
  store: new RedisStore({
    client: redisClient,
    prefix: 'session:',
  }),
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1);
  sessionConfig.cookie.secure = true;
  sessionConfig.proxy = true;
}

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      childSrc: ['blob:'],
      objectSrc: [],
      imgSrc: [
        "'self'",
        'blob:',
        'data:',
        'https://res.cloudinary.com/',
        'https://images.unsplash.com/',
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  if (req.path !== '/login' && req.session.returnTo) {
    delete req.session.returnTo;
  }

  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use(globalLimiter);

app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);
app.use('/contact', contactRoutes);

app.get('/', (req, res) => {
  res.render('home');
});

app.all('/{*splat}', (req, res) => {
  res.status(404).render('notFound');
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  const redirectPath = err.redirectPath || req.get('Referrer') || '/';

  console.error(err.stack);

  deleteUploadedImages(req);

  if (!err.message) {
    err.message = 'Oh no! Something went wrong';
  }

  req.flash('error', err.message);
  res.status(statusCode).redirect(redirectPath);
});

export default app;
