if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express')
    , path = require('path')
    , mongoose = require('mongoose')
    , {RedisSessionStore: redisStore, redisClient} = require('./redis')
    , engine = require('ejs-mate')
    , methodOverride = require('method-override')
    , session = require('express-session')
    , flash = require('connect-flash')
    , passport = require('passport')
    , LocalStrategy = require('passport-local')
    , User = require('./models/user')
    , mongoSanitize = require('express-mongo-sanitize')
    , helmet = require('helmet')
    , cookieParser = require('cookie-parser')
    , dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'
    , secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const campgroundRoutes = require('./routes/campgrounds')
    , reviewRoutes = require('./routes/reviews')
    , userRoutes = require('./routes/users')
    , contactRoutes = require('./routes/contacts');

const {
    scriptSrcUrls,
    styleSrcUrls,
    connectSrcUrls,
    fontSrcUrls
} = require('./allowedUrls');

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to Database');
});

redisClient.on('error', (err) => {
    console.log('Session store error: ', err);
});
redisClient.on('connect', () => {
    console.log('Connected to Session Store');
});

const app = express();

app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(mongoSanitize());
app.use(cookieParser(secret));

const sessionConfig = {
    name: 'session',
    secret,
    resave: true,
    rolling: true,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        // secure: true, //for https
    },
    store: new redisStore({client: redisClient})
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
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/bartoszt/",
                "https://images.unsplash.com/",
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
    if(req.path !== '/login' && req.session.returnTo)
        delete req.session.returnTo;
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);
app.use('/contact', contactRoutes);

app.get('/', (req, res) => {
    res.render('home');
})

app.all('*', (req, res) => {
    res.status(404).render('notFound');
})

app.use((err, req, res, next) => {
    const {statusCode = 500} = err
        , redirectPath = err.redirectPath || 'back';
    if(!err.message)
        err.message = 'Oh no! Something went wrong';
    req.flash('error', err.message);
    res.status(statusCode).redirect(redirectPath);
})

app.listen(3000, () => {
    console.log('Serving on port 3000');
})