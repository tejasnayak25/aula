let express = require("express");
let app = express();
let path = require("path");
let { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API??"");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", 
    systemInstruction: "given question, answer, marks and response, evaluate the response and return appropriate marks"
});

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "..")));
app.use(express.json());

async function generate(prompt) {
    try{
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        return text;
    } catch (e) {
        console.log(e);
        return null;
    }
}

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

app.route("/classroom/:id/quiz/:q/responses")
.get((req, res) => {
    res.sendFile(path.join(__dirname, "html", "responses.html"));
});

app.route("/classroom/:id/edit-quiz/:q")
.get((req, res) => {
    res.sendFile(path.join(__dirname, "html", "form_edit.html"));
});

app.route("/evaluate")
.post(async (req, res) => {
    let body = req.body;

    let rep = await generate(body);

    res.json({
        status: rep ? 200 : 500,
        content: rep
    });
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});