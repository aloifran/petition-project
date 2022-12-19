require("dotenv").config();
const { SECRET } = process.env;
const cookieSession = require("cookie-session");
const express = require("express");
const app = express();
const db = require("./db");
const encrypt = require("./encrypt");

// pretty date setup
const TimeAgo = require("javascript-time-ago");
const en = require("javascript-time-ago/locale/en");
TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo("en-US");

// handlebars
const { engine } = require("express-handlebars");
app.engine("handlebars", engine());
app.set("view engine", "handlebars");

// cookie session
app.use(
    cookieSession({
        secret: SECRET,
        maxAge: 24 * 60 * 60 * 1000 * 7, // 1 week
    })
);

// serve files
app.use(express.static("./public"));

// req body parser
const parseBody = express.urlencoded({ extended: false });
app.use(parseBody);

// GET ROUTES --------------------------------------------

app.get("/", (req, res) => {
    res.redirect("/petition");
});

app.get("/petition", (req, res) => {
    // is usr logged in?
    if (req.session.userId) {
        // Show canvas
        let usrSignature;
        if (req.session.signed) {
            db.getUserSignature(req.session.userId).then((signature) => {
                usrSignature = signature.signature;
            });
        }
        db.getAllSignatures().then((signatures) => {
            res.render("petition", {
                count: signatures.length,
                signed: req.session.signed,
                signature: usrSignature,
            });
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/thanks", (req, res) => {
    console.log(req.session);

    if (!req.session.signed) {
        res.redirect("/petition");
    } else {
        db.getAllSignatures().then((signatures) => {
            // canvas
            const usrSignature = signatures.find(
                (s) => s.user_id === req.session.userId
            ).signature;

            res.render("thanks", {
                count: signatures.length,
                signature: usrSignature,
            });
        });
    }
});

app.get("/signers", (req, res) => {
    db.getSignersData().then((signers) => {
        res.render("signers", {
            count: signers.length,
            signers: signers,
            helpers: {
                getPrettyDate(date) {
                    return timeAgo.format(date);
                },
            },
        });
    });
});

app.get("/signers_:signerCity", (req, res) => {
    const signerCity = req.params.signerCity;

    db.getSignersData().then((signers) => {
        const signersFromCity = signers.filter(
            (signer) => signer.city === signerCity
        );
        res.render("signerCity", {
            count: signersFromCity.length,
            signers: signersFromCity,
            city: signerCity,
            helpers: {
                getPrettyDate(date) {
                    return timeAgo.format(date);
                },
            },
        });
    });
});

app.get("/register", (req, res) => {
    res.render("register");
});

// move this var somewhere else?
let invalidCredentials;
app.get("/login", (req, res) => {
    res.render("login", {
        invalidCredentials: invalidCredentials,
    });
});

app.get("/profile", (req, res) => {
    res.render("profile");
});

app.get("/profile_edit", (req, res) => {
    db.getUserData(req.session.userId).then((userData) => {
        req.session.user = userData;

        res.render("profile_edit", {
            userData: userData,
        });
    });
});

app.get("*", (req, res) => {
    res.status(404).end("Sorry, page not found");
});

// POST ROUTES --------------------------------------------

app.post("/register", (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    // Hash password before storing
    encrypt
        .hash(password)
        .then((hashedPwd) => db.addUser(firstName, lastName, email, hashedPwd))
        // Save userId in a cookie
        // OR save firstName lastName into a user obj in the cookie. Where do we need it later?
        .then(() => db.getLastUserId())
        .then((id) => {
            console.log("Register: user id", id);
            req.session.userId = id;
            res.redirect("/profile");
        });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    // validate email
    db.getUserByEmail(email).then((usr) => {
        if (usr) {
            invalidCredentials = false;
            // validate password
            encrypt.compare(password, usr.password).then((match) => {
                if (match === true) {
                    invalidCredentials = false;
                    // save userId in a cookie
                    req.session.userId = usr.id;
                    // validate if they already signed petition
                    if (req.session.signed === true) {
                        if (req.session.signed === true);
                        res.redirect("/thanks");
                    } else {
                        res.redirect("/petition");
                    }
                } else {
                    console.log("Login: invalid password:", password);
                    invalidCredentials = true;
                    res.redirect("/login");
                }
            });
        } else {
            console.log("Login: invalid email:", email);
            invalidCredentials = true;
            res.redirect("/login");
        }
    });
});

app.post("/sign", (req, res) => {
    // if usr is here, it's already logged in
    const { signature } = req.body;

    db.addSignature(req.session.userId, signature).then(() => {
        // save cookie with signed=true
        req.session.signed = true;
        res.redirect("/thanks");
    });
});

// TODO: Add a pop up asking , are you sure? maybe in browser js
app.post("/unsign", (req, res) => {
    db.removeUserSignature(req.session.userId).then(() => {
        // unsign from session
        req.session.signed = false;
        // redirect
        res.redirect("/");
    });
});

app.post("/profile", (req, res) => {
    const { city, age, homepage } = req.body;
    // insert query with optional fields, then in /edit make an update for optional fields
    db.addUserProfile(req.session.userId, city, age, homepage).then(() => {
        res.redirect("/petition");
    });
});

app.post("/profile_edit", (req, res) => {
    // user data from session
    const {
        firstname: firstNameDb,
        lastname: lastNameDb,
        email: emailDb,
        password: passDb,
        city: cityDb,
        age: ageDb,
        homepage: homepageDb,
    } = req.session.user;

    // user data from body
    const {
        firstName: firstNameEdit,
        lastName: lastNameEdit,
        email: emailEdit,
        password: passEdit,
        age: ageEdit,
        city: cityEdit,
        homepage: homepageEdit,
    } = req.body;

    // validate user fields
    if (
        firstNameDb !== firstNameEdit ||
        lastNameDb !== lastNameEdit ||
        emailDb !== emailEdit
    ) {
        db.updateUser(
            firstNameEdit,
            lastNameEdit,
            emailEdit,
            req.session.userId
        ).then(() => console.log("UPDATED USER"));
    }

    // validate pass
    if (passEdit !== "") {
        // if pass was changed, hash it
        encrypt
            .hash(passEdit)
            .then((hashedPwd) =>
                db.updateUserPass(hashedPwd, req.session.userId)
            )
            .then(() => console.log("UPDATED USER PASSWORD"));
    }

    // validate user profile
    if (
        cityDb !== cityEdit ||
        ageDb !== ageEdit ||
        homepageDb !== homepageEdit
    ) {
        db.updateUserProfile(
            cityEdit,
            ageEdit,
            homepageEdit,
            req.session.userId
        ).then(() => console.log("UPDATED USER PROFILE"));
    }

    // TODO: add redirect
    // update user data in session after editing
    // this should be the result of promises, cause if it fails, then it will store invalid data
    db.getUserData(req.session.userId).then(
        (userData) => (req.session.user = userData)
    );
});

app.listen(process.env.PORT || 8081, () =>
    console.log("Server running on port 8081")
);
