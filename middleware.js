module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

module.exports.notLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next();
    }
    req.flash('success', 'You are already signed in.');
    res.redirect('/campgrounds');
};