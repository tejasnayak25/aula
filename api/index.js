let express = require("express");
let app = express();
let path = require("path");

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "..")));
app.use(express.json());

app.route("/")
.get((req, res) => {
    res.sendFile(path.join(__dirname, "home.html"));
});

app.route("/login")
.get((req, res) => {
    res.sendFile(path.join(__dirname, "html", "login.html"));
});

app.route("/signup")
.get((req, res) => {
    res.sendFile(path.join(__dirname, "html", "signup.html"));
});

app.route("/dashboard")
.get((req, res) => {
    res.sendFile(path.join(__dirname, "html", "dashboard.html"));
});

app.route("/classroom/:id")
.get((req, res) => {
    res.sendFile(path.join(__dirname, "html", "classroom.html"));
});

app.route("/classroom/:id/new-quiz")
.get((req, res) => {
    res.sendFile(path.join(__dirname, "html", "new_form.html"));
});

app.route("/classroom/:id/quiz/:q")
.get((req, res) => {
    res.sendFile(path.join(__dirname, "html", "quiz.html"));
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});