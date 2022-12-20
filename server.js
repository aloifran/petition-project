require("dotenv").config();
const { SECRET } = process.env;
const cookieSession = require("cookie-session");
const express = require("express");
const app = express();
const db = require("./db");
const encrypt = require("./encrypt");
const {
    requireLoggedInUser,
    requireLoggedOutUser,
    requireSignature,
} = require("./middleware");

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

// MIDDLEWARE --------------------------------------------
app.use(requireLoggedInUser);
app.use(requireLoggedOutUser);

// GET ROUTES --------------------------------------------
app.get("/", (req, res) => {
    res.redirect("/petition");
});

app.get("/petition", (req, res) => {
    let handSignature;
    if (req.session.signed === true) {
        db.getUserSignature(req.session.userId).then((signature) => {
            handSignature = signature.signature;
        });
    }
    db.getAllSignatures().then((signatures) => {
        res.render("petition", {
            count: signatures.length,
            signed: req.session.signed,
            signature: handSignature,
        });
    });
});

app.get("/thanks", requireSignature, (req, res) => {
    db.getAllSignatures().then((signatures) => {
        const handSignature = signatures.find(
            (s) => s.user_id === req.session.userId
        ).signature;

        res.render("thanks", {
            count: signatures.length,
            signature: handSignature,
        });
    });
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
    encrypt
        .hash(password)
        .then((hashedPwd) => db.addUser(firstName, lastName, email, hashedPwd))
        .then(() => db.getLastUserId())
        .then((id) => {
            console.log("Register: user id", id);
            req.session.userId = id;
            res.redirect("/profile");
        });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    db.getUserByEmail(email).then((user) => {
        if (user) {
            invalidCredentials = false;
            encrypt.compare(password, user.password).then((match) => {
                if (match) {
                    invalidCredentials = false;
                    req.session.userId = user.id;
                    console.log("Log in: user", user);

                    if (user.signature) {
                        req.session.signed = true;
                        res.redirect("/thanks");
                    } else {
                        res.redirect("/petition");
                    }
                } else {
                    invalidCredentials = true;
                    res.redirect("/login");
                }
            });
        } else {
            invalidCredentials = true;
            res.redirect("/login");
        }
    });
});

app.post("/sign", (req, res) => {
    const { signature } = req.body;
    db.addSignature(req.session.userId, signature).then(() => {
        req.session.signed = true;
        res.redirect("/thanks");
    });
});

app.post("/unsign", (req, res) => {
    db.removeUserSignature(req.session.userId).then(() => {
        req.session.signed = false;
        res.redirect("/");
    });
});

app.post("/profile", (req, res) => {
    const { city, age, homepage } = req.body;
    db.addUserProfile(req.session.userId, city, age, homepage).then(() => {
        res.redirect("/petition");
    });
});

app.post("/profile_edit", (req, res) => {
    let userDb;
    db.getUserData(req.session.userId).then((data) => {
        userDb = data;
    });

    const { firstName, lastName, email, password, age, city, homepage } =
        req.body;

    // update user profile without validation
    db.updateUserProfile(city, age, homepage, req.session.userId)
        .then(() => {
            console.log("UPDATED NON MANDATORY FIELDS");
            // validate mandatory fields
            if (
                userDb.firstname !== firstName ||
                userDb.lastname !== lastName ||
                userDb.email !== email
            ) {
                return db
                    .updateUser(firstName, lastName, email, req.session.userId)
                    .then(() => console.log("UPDATED MANDATORY FIELDS"));
            }
        })
        .then(() => {
            // validate pass
            if (password !== "") {
                return encrypt
                    .hash(password)
                    .then((hashedPwd) =>
                        db
                            .updateUserPass(hashedPwd, req.session.userId)
                            .then(() => console.log("UPDATED PASSWORD"))
                    );
            }
        })
        .then(() => {
            res.redirect("/");
        });
});

app.post("/logout", (req, res) => {
    req.session = null;
    res.redirect("/login");
});

app.listen(process.env.PORT || 8081, () =>
    console.log("Server running on port 8081")
);
