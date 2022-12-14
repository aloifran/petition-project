require("dotenv").config();
const { SECRET } = process.env;
const cookieSession = require("cookie-session");
const express = require("express");
const app = express();
const db = require("./db");
const encrypt = require("./encrypt");

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

// TODO: implement logic to validate usr
// usr exists? NO => /register
// usr exists? YES not logged in? => /login
// usr exists? YES is logged in? => /petition
app.get("/petition", (req, res) => {
    res.render("petition");
});

app.get("/thanks", (req, res) => {
    // require cookie
    console.log(req.session);

    // cookie validation
    if (!req.session.signatureId) {
        db.getLastSignatureId().then((id) => {
            if (req.session.signatureId !== id) {
                res.redirect("/petition");
            }
        });
    } else {
        db.getAllSignatures().then((signatures) => {
            // CANVAS RELATED
            const lastSignatureCode = signatures.find(
                (s) => s.id === req.session.signatureId
            ).signature;

            res.render("thanks", {
                count: signatures.length,
                signature: lastSignatureCode,
            });
        });
    }
});

app.get("/signers", (req, res) => {
    db.getAllSignatures().then((signatures) => {
        res.render("signers", {
            signatures: signatures,
            count: signatures.length,
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
    // PROVIDE OPTIONS FOR VALIDATION
    res.render("login", {
        invalidCredentials: invalidCredentials,
    });
});

app.get("*", (req, res) => {
    res.status(404).end("Sorry, page not found");
});

// POST ROUTES --------------------------------------------

app.post("/register", (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    // Hash the password before saving to DB
    encrypt
        .hash(password)
        .then((hashedPwd) => db.addUser(firstName, lastName, email, hashedPwd))
        // Save userId in a cookie
        .then(() => db.getLastUserId())
        .then((id) => {
            console.log("Register: user id", id);
            req.session.userId = id;
            res.redirect("/petition");
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
                    // save signatureId in a cookie
                    db.getSignatureByUserId(usr.id).then((signature) => {
                        if (signature) {
                            req.session.signatureId = signature.id;
                            res.redirect("/thanks");
                        } else {
                            res.redirect("/petition");
                        }
                    });
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
    const { signature } = req.body;
    // if usr is here, it already has a cookie set
    const userId = req.session.userId;

    db.addSignature(userId, signature)
        .then(() => db.getLastSignatureId())
        .then((sigId) => {
            // save cookie with signature id
            req.session.signatureId = sigId;
            res.redirect("/thanks");
        });
});

app.listen(8081, () => console.log("Server running on port 8081"));
