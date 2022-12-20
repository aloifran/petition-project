// general rules for user access, to use in app.use() middleware

// only accepts logged in users
module.exports.requireLoggedInUser = (req, res, next) => {
    if (!req.session.userId && req.url != "/register" && req.url != "/login") {
        return res.redirect("/login");
    }
    next();
};

// only accepts logged out users
module.exports.requireLoggedOutUser = (req, res, next) => {
    if (
        (req.session.userId && req.url === "/register") ||
        (req.session.userId && req.url === "/login")
    ) {
        return res.redirect("/petition");
    }
    next();
};

// only accepts signed users
module.exports.requireSignature = (req, res, next) => {
    if (!req.session.signed) {
        return res.redirect("/petition");
    }
    next();
};
