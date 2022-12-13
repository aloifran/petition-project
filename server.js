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
            // get last signature, pass values
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

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("*", (req, res) => {
    res.status(404).end("Sorry, page not found");
});

// POST ROUTES --------------------------------------------

app.post("/register", (req, res) => {
    // Get user data
    const { firstName, lastName, email, password } = req.body;

    // Hash the password before saving to the Database
    encrypt.hash(password).then((hashedPwd) => {
        db.addUser(firstName, lastName, email, hashedPwd).then(() => {
            // Save userId in a cookie if query is succesfull
            // then
            // redirect to petition for now
            res.redirect("/petition");
        });
    });
});

app.post("/login", (req, res) => {
    // compare stored pass with login provided pass
    // encrypt.compare(pass);
});

app.post("/sign", (req, res) => {
    const { firstName, lastName, signature } = req.body;

    db.addSignature(firstName, lastName, signature)
        .then(() => db.getLastSignatureId())
        .then((id) => {
            // save cookie with new signature id
            req.session.signatureId = id;
        })
        .then(() => res.redirect("/thanks"));
});

app.listen(8081, () => console.log("Server running on port 8081"));
