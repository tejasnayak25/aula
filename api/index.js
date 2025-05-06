let express = require("express");
let app = express();
let path = require("path");
let { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API });

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "..")));
app.use(express.json());

async function generate(prompt) {
    try{
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
              systemInstruction: "Given question, answer (actual), marks, and response (student), evaluate the response and return appropriate marks.",
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'object',
                required: ['result'],
                properties: {
                  result: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['qno', 'marks'],
                      properties: {
                        qno: {
                          type: 'number',
                          description: 'Question number',
                        },
                        marks: {
                          type: 'number',
                          description: 'Marks awarded',
                        }
                      }
                    }
                  }
                }
              }
            }
        });          
        let text = result.text;
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

app.route("/ai/evaluate")
.post(async (req, res) => {
    let body = req.body;

    let rep = await generate(JSON.stringify(body));

    res.json({
        status: rep ? 200 : 500,
        content: (JSON.parse(rep))?.result
    });
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});