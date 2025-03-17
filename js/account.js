// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, getIdToken } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, query, collection, where, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc, setDoc, addDoc, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
// import { ref, getStorage, uploadBytes, getDownloadURL, listAll, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {apiKey: "AIzaSyDIQKNaRwnsxlCSZBACO1K7QRwSRlRjFwE",authDomain: "varnotsava-405511.firebaseapp.com",projectId: "varnotsava-405511",storageBucket: "varnotsava-405511.appspot.com",messagingSenderId: "808606184188",appId: "1:808606184188:web:b0e51856474ba07f701d79",measurementId: "G-WB3VPNT4EK"};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const firestore = getFirestore();

let isDashboard = location.pathname === "/dashboard";

async function getClassrooms(user) {
    const classroomsRef = collection(firestore, "classrooms");

    const creatorQuery = query(classroomsRef, where("creator", "==", user.email));

    // Query classrooms where the user is a student
    const studentQuery = query(classroomsRef, where("members", "array-contains", { email: user.email, role: "student" }));

    // Query classrooms where the user is a teacher
    const teacherQuery = query(classroomsRef, where("members", "array-contains", { email: user.email, role: "teacher" }));

    // Fetch both queries in parallel
    const [studentSnapshot, teacherSnapshot] = await Promise.all([
        getDocs(creatorQuery),
        getDocs(studentQuery),
        getDocs(teacherQuery),
    ]);

    // Merge results while avoiding duplicates
    const classrooms = new Map();

    studentSnapshot.forEach((doc) => classrooms.set(doc.id, { id: doc.id, ...doc.data() }));
    teacherSnapshot.forEach((doc) => classrooms.set(doc.id, { id: doc.id, ...doc.data() }));

    return Array.from(classrooms.values());
}

auth.onAuthStateChanged(async (user) => {
    if(!user) {
        if(location.pathname !== "/login" && location.pathname !== "/signup")
        window.open("/login", "_self");
        document.getElementById("continue-btn").onclick = () => {
            signup();
        }
    } else {
        if(location.pathname === "/login" || location.pathname === "/signup") {
            window.open("/dashboard", "_self");
        }
        
        if(isDashboard) {
            let classrooms = [];
            
            // Fetch data once
            getClassrooms(user).then((snapshot) => {
                let classrooms = []; // Initialize array to store classrooms
                snapshot.forEach((doc) => {
                    let data = doc;
                    let div = document.createElement("div");
                    div.className =
                        "cont h-fit rounded-lg bg-lime-200 border-2 border-lime-300 shadow-none shadow-lime-500 hover:shadow-lg transition-all text-slate-800";
                    div.innerHTML = `
                    <h1 class="pt-12 p-4 text-2xl font-bold ">${data.name}</h1>
                    <p class="p-4 pt-0 text-sm">${data.description ?? "No description yet!"}</p>
                    <a href="/classroom/${data.id}" class="pt-0 p-4 flex gap-1 hover:gap-2 text-lime-700 btn btn-ghost w-fit hover:bg-transparent border-0 shadow-none">
                        Continue 
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="fill: oklch(0.532 0.157 131.589);">
                            <path d="m11.293 17.293 1.414 1.414L19.414 12l-6.707-6.707-1.414 1.414L15.586 11H6v2h9.586z"></path>
                        </svg>
                    </a>
                    `;
            
                    document.getElementById("classroomsHolder").appendChild(div); // Append the div to the page
                });
            
                console.log("Classrooms:", classrooms);
            }).catch((error) => {
                console.error("Error fetching classrooms:", error);
            });

            document.getElementById("add-class-btn").onclick = () => {
                document.getElementById("add-mem-win").classList.replace("hidden", "flex");
            }

            document.getElementById("mem-close").onclick = () => {
                document.getElementById("add-mem-win").classList.replace("flex", "hidden");
            }

            document.getElementById("add-mem").onclick = async () => {
                await addDoc(collection(firestore, "classrooms"), {
                    name: document.getElementById("name").value,
                    description: document.getElementById("desc").value,
                    creator: user.email,
                    members: []
                });

                location.reload();
            }

            document.getElementById("logout-btn").onclick = async () => {
                await auth.signOut();
            }

            document.getElementById("tabs").onchange = async () => {
                if(document.getElementById("tabs").value === "logout") {
                    await auth.signOut();
                }
                if(document.getElementById("tabs").value === "home") {
                    window.open(location.origin, "_self");
                }
            }
        }

        if(location.pathname.endsWith("/new-quiz")) {
            const pathSegments = window.location.pathname.split("/");
            const classid = pathSegments[2];
            let d = doc(firestore, "classrooms", classid);

            let classData = await getCurrentClassMember(d, user);
            if (!classData || (classData.currentMem?.role !== "teacher" && classData.class.creator !== user.email)) {
                return;
            }

            let inps = [];
            window.inps = inps;

            if(!classData.class.ai_eval) {
                document.getElementById("ai-eval").setAttribute("disabled", "disabled");
            }

            let radio = new Radio({
                label: "Question 1",
                id: `inp_${Date.now()}`,
                type: "text",
                debug: true,
                onchange: (e, input) => {

                },
                ondelete: () => {
                    inps.splice(0, 1);
                },
                onduplicate: (rad) => {
                    inps.splice(1, 0, rad);
                }
            });

            inps.push(radio);

            document.getElementById("questions").append(radio.element);
            radio._onappend();

            document.getElementById("add-inp").onclick = () => {
                let i = inps.length;
                let radio = new Radio({
                    label: `Question ${i+1}`,
                    id: `inp_${Date.now()}`,
                    type: "text",
                    debug: true,
                    onchange: (e, input) => {
    
                    },
                    ondelete: () => {
                        inps.splice(i, 1);
                    },
                    onduplicate: (rad) => {
                        inps.splice(i+1, 0, rad);
                    }
                });

                inps.push(radio);
    
                document.getElementById("questions").append(radio.element);
                radio._onappend();
            }

            document.getElementById("settings-btn").onclick = () => {
                document.getElementById("add-mem-win").classList.replace("hidden", "flex");
            }

            document.getElementById("mem-close").onclick = () => {
                document.getElementById("add-mem-win").classList.replace("flex", "hidden");
            }

            let deadline = null;
            let layout = null;
            let ai = null;

            document.getElementById("add-mem").onclick = async () => {
                let val = document.getElementById("datetime").value;
                deadline = Date.parse(val);
                layout = document.getElementById("pages").value;
                ai = document.getElementById("ai-eval").checked;
                document.getElementById("add-mem-win").classList.replace("flex", "hidden");
            }

            document.getElementById("create-form").onclick = async () => {
                let fields = inps.map(i => ({
                    ...i.props,
                    question: document.getElementById(i.props.id).querySelector(".question").innerText,
                    data: i.props.type === "radio"
                        ? Array.from(document.getElementById(i.props.id).querySelectorAll(".data input[type='radio']")).map(option => 
                            option.nextElementSibling.innerText)
                        : [],
                    response: i.props.type === "textarea" ?  document.getElementById(i.props.id).querySelector(`#${i.props.id}-response`).innerText : (i.props.type === "radio" ? document.getElementById(i.props.id).querySelector(`.data input[name="${i.props.id}-response"]:checked`)?.nextElementSibling.innerText : document.getElementById(i.props.id).querySelector(`#${i.props.id}-response`).value)
                }));

                let setdata = {};

                if(deadline) setdata.deadline = deadline;
                if(layout) setdata.layout = layout;
                if(ai) setdata.ai = ai;

                await addDoc(collection(d, "quizzes"), {
                    name: document.getElementById("qname").innerText,
                    description: document.getElementById("qdesc").innerText,
                    creator: user.email,
                    fields: fields,
                    createdAt: serverTimestamp(),
                    ...setdata
                });

                window.open(`/classroom/${classid}?section=quizzes`, "_self");
            }
            return;
        }
        if(location.pathname.includes("/quiz/") && location.pathname.endsWith("responses")) {
            const pathSegments = window.location.pathname.split("/");
            const classid = pathSegments[2];
            let d = doc(firestore, "classrooms", classid);

            let classData = await getCurrentClassMember(d, user);
            if (
                !classData || 
                (!["teacher", "student"].includes(classData.currentMem?.role) && classData.class?.creator !== user.email)
            ) {
                return;
            }              

            let formid = pathSegments[4];

            let f = await getDoc(doc(d, "quizzes", formid));

            f = { id: f.id, ...f.data() };

            let results = [];

            document.getElementById("quiz-name").innerText = f.name;

            let table = document.getElementById("res-table");

            const updatesRef = collection(d, "quizzes", formid, "responses");
            const updatesQuery = query(updatesRef, orderBy("createdAt", "desc"));

            getDocs(updatesQuery).then(vals => {
                let quiz = vals.docs.map(d => ({ id: d.id, ...d.data() }));
                results = [];

                let currentMem = classData?.currentMem;

                quiz.forEach(i => {
                    if(currentMem && currentMem.role === "student" && i.creator !== user.email) return;

                    let marks = 0;
                    i.fields.forEach(j => {
                        marks += j.marks;
                    });
                    results.push({user:i.creator, marks: marks});

                    let tr = document.createElement("tr");
                    tr.className = "border-b border-lime-400";
                    tr.innerHTML = `
                        <td>${i.creator}</td>
                        <td>${marks}</td>
                    `;

                    table.append(tr);
                });
            });

            document.getElementById("download-csv").onclick = () => {
                let text = "Email,Score\n";
                results.forEach(r => {
                    text += `${r.user},${r.marks}\n`;
                });
                let blob = new Blob([text], { type: "application/csv" });
                let url = URL.createObjectURL(blob);
                let a = document.createElement("a");
                a.href = url;
                a.download = `${f.name}.csv`;
                a.click();
            }

            document.getElementById("share-whatsapp").onclick = () => {
                window.open(`https://api.whatsapp.com/send?text=Quiz results for '${f.name}' released! Check your results here -> ${location.href}`, "_blank");
            }

            document.getElementById("share-email").onclick = () => {
                window.open(`mailto:${results.map(r => r.user).join(",")}?subject=Quiz results for '${f.name}' released!&body=Check your results here -> ${location.href}`, "_self");
            }

            return;
        }
        if(location.pathname.includes("/quiz/") && !location.pathname.endsWith("responses")) {
            const pathSegments = window.location.pathname.split("/");
            const classid = pathSegments[2];
            let d = doc(firestore, "classrooms", classid);

            let classData = await getCurrentClassMember(d, user);
            if (!classData || classData.currentMem?.role !== "student") {
                return;
            }            

            let formid = pathSegments[4];

            let f = await getDoc(doc(d, "quizzes", formid));

            f = { id: f.id, ...f.data() };

            let inps = [];

            document.getElementById("qname").innerText = f.name ?? "Quiz";
            document.getElementById("qdesc").innerText = f.description ?? "";

            f.fields.forEach(g => {
                let radio = new Radio({
                    label: g.question,
                    id: g.id,
                    type: g.type,
                    debug: false,
                    data: g.data,
                    required: g.required,
                    marks: g.marks,
                    onchange: (e, input) => {
    
                    },
                    ondelete: () => {
                        // inps.splice(0, 1);
                    }
                });

                radio.response = g.response;
    
                inps.push(radio);

                document.getElementById("questions").append(radio.element);
                radio._onappend();
            });

            let ls = document.getElementById("questions").children;
            let i=0;

            if (f.layout && f.layout === "multi-page") {
                for (let j = 1; j < ls.length; j++) {
                    ls[j].classList.add("hidden");
                }
                ls[0].classList.add("visible");
                document.getElementById("submit-form").innerHTML = `<i class="fi fi-sr-angle-right"></i> Next`;
                document.getElementById("previous-btn").setAttribute("disabled", "disabled");
            }

            document.onclick = () => {
                document.body.requestFullscreen();
                document.onclick = () => {}
            }

            window.onblur = () => {
                document.getElementById("submit-form").click();
            }

            document.getElementById("previous-btn").onclick = () => {
                if (i > 0) {
                    ls[i].classList.replace("visible", "hidden");
                    ls[i - 1].classList.replace("hidden", "visible");
                    i--;
            
                    document.getElementById("submit-form").innerHTML = `<i class="fi fi-sr-angle-right"></i> Next`;
                    
                    if (i === 0) {
                        document.getElementById("previous-btn").setAttribute("disabled", "disabled");
                    }
                }
            };

            document.getElementById("submit-form").onclick = async () => {
                if (f.layout && f.layout === "multi-page") {
                    if (i < ls.length - 1) {
                        ls[i].classList.replace("visible", "hidden");
                        ls[i + 1].classList.replace("hidden", "visible");
                        i++;
            
                        document.getElementById("previous-btn").removeAttribute("disabled");
            
                        if (i === ls.length - 1) {
                            document.getElementById("submit-form").innerHTML = `<i class="fi fi-sr-check"></i> Submit`;
                        }
                    } else {
                        await submitForm(); // Calls the function to submit data
                    }
                    return;
                }
            
                await submitForm();
            };
            
            async function submitForm() {
                let fields = inps.map(i => ({
                    question: document.getElementById(i.props.id).querySelector(".question").innerText,
                    response: i.props.type === "textarea" 
                        ? document.getElementById(i.props.id).querySelector(`#${i.props.id}-response`).innerText 
                        : (i.props.type === "radio" 
                            ? document.getElementById(i.props.id).querySelector(`.data input[name="${i.props.id}-response"]:checked`)?.nextElementSibling.innerText 
                            : document.getElementById(i.props.id).querySelector(`#${i.props.id}-response`).value),
                    marks: compare(
                        i.response,
                        i.props.type === "textarea" 
                            ? document.getElementById(i.props.id).querySelector(`#${i.props.id}-response`).innerText 
                            : (i.props.type === "radio" 
                                ? document.getElementById(i.props.id).querySelector(`.data input[name="${i.props.id}-response"]:checked`)?.nextElementSibling.innerText 
                                : document.getElementById(i.props.id).querySelector(`#${i.props.id}-response`).value),
                        i.props.marks, 
                        { ...i.props, question: document.getElementById(i.props.id).querySelector(".question").innerText }, 
                        f.ai
                    )
                }));
            
                await addDoc(collection(d, "quizzes", formid, "responses"), {
                    creator: user.email,
                    fields: fields,
                    createdAt: serverTimestamp()
                });
            
                await updateDoc(doc(d, "quizzes", formid), {
                    responses: arrayUnion(user.email)
                });
            
                window.open(`/classroom/${classid}?section=quizzes`, "_self");
            }
            return;
        }
        if(location.pathname.includes("/edit-quiz/")) {
            const pathSegments = window.location.pathname.split("/");
            const classid = pathSegments[2];
            let d = doc(firestore, "classrooms", classid);

            let classData = await getCurrentClassMember(d, user);
            
            if (!classData || (classData.currentMem?.role !== "teacher" && classData.class.creator !== user.email)) {
                console.log("hi")
                return;
            }

            let formid = pathSegments[4];

            let f = await getDoc(doc(d, "quizzes", formid));

            f = { id: f.id, ...f.data() };

            let inps = [];
            window.inps = inps;

            if(!classData.class.ai_eval) {
                document.getElementById("ai-eval").setAttribute("disabled", "disabled");
            }

            document.getElementById("qname").innerText = f.name ?? "Quiz";
            document.getElementById("qdesc").innerText = f.description ?? "";

            f.fields.forEach(g => {
                let i = inps.length;
                let radio = new Radio({
                    label: g.question,
                    id: g.id,
                    type: g.type,
                    debug: true,
                    data: g.data,
                    required: g.required,
                    marks: g.marks,
                    response: g.response,
                    onchange: (e, input) => {
    
                    },
                    ondelete: () => {
                        inps.splice(i, 1);
                    },
                    onduplicate: (rad) => {
                        inps.splice(i+1, 0, rad);
                    }
                });
    
                inps.push(radio);
    
                document.getElementById("questions").append(radio.element);
                radio._onappend();
            });

            document.getElementById("add-inp").onclick = () => {
                let i = inps.length;
                let radio = new Radio({
                    label: `Question ${i+1}`,
                    id: `inp_${Date.now()}`,
                    type: "text",
                    debug: true,
                    onchange: (e, input) => {
    
                    },
                    ondelete: () => {
                        inps.splice(i, 1);
                    },
                    onduplicate: (rad) => {
                        inps.splice(i+1, 0, rad);
                    }
                });

                inps.push(radio);
    
                document.getElementById("questions").append(radio.element);
                radio._onappend();
            }

            document.getElementById("settings-btn").onclick = () => {
                document.getElementById("add-mem-win").classList.replace("hidden", "flex");
            }

            document.getElementById("mem-close").onclick = () => {
                document.getElementById("add-mem-win").classList.replace("flex", "hidden");
            }

            document.getElementById("results-btn").onclick = () => {
                window.open(`/classroom/${classid}/quiz/${formid}/responses`, "_self");
            }

            let deadline = null;
            let layout = null;
            let ai = null;

            document.getElementById("datetime").value = f.deadline ?? "";
            if(f.layout) {
                document.getElementById("pages").querySelector(`option[value="${f.layout}"]`).setAttribute("selected", "selected");
            }
            document.getElementById("ai-eval").checked = f.ai;

            document.getElementById("add-mem").onclick = async () => {
                let val = document.getElementById("datetime").value;
                deadline = Date.parse(val);
                layout = document.getElementById("pages").value;
                ai = document.getElementById("ai-eval").checked;
                document.getElementById("add-mem-win").classList.replace("flex", "hidden");
            }

            document.getElementById("create-form").onclick = async () => {
                let fields = inps.map(i => ({
                    ...i.props,
                    question: document.getElementById(i.props.id).querySelector(".question").innerText,
                    data: i.props.type === "radio"
                        ? Array.from(document.getElementById(i.props.id).querySelectorAll(".data input[type='radio']")).map(option => 
                            option.nextElementSibling.innerText)
                        : [],
                    response: i.props.type === "textarea" ?  document.getElementById(i.props.id).querySelector(`#${i.props.id}-response`).innerText : (i.props.type === "radio" ? document.getElementById(i.props.id).querySelector(`.data input[name="${i.props.id}-response"]:checked`)?.nextElementSibling.innerText : document.getElementById(i.props.id).querySelector(`#${i.props.id}-response`).value)
                }));

                let setdata = {};

                if(deadline) setdata.deadline = deadline;
                if(layout) setdata.layout = layout;
                if(ai) setdata.ai = ai;

                await updateDoc(doc(d, "quizzes", formid), {
                    name: document.getElementById("qname").innerText,
                    description: document.getElementById("qdesc").innerText,
                    creator: user.email,
                    fields: fields,
                    createdAt: serverTimestamp(),
                    ...setdata
                });

                window.open(`/classroom/${classid}?section=quizzes`, "_self");
            }
            return;
        }
        if(location.pathname.startsWith("/classroom/")) {
            let pquery = new URLSearchParams(location.search);
            let path = "updates";
            if(pquery.has("section")) {
                path = pquery.get("section");
            }

            document.getElementById("mini-menu").querySelector(`#${path}`).classList.add("border-b-2");

            let classid = location.pathname.split("/").pop();
            let d = doc(firestore, "classrooms", classid);

            let classdata = {};

            getDoc(d).then((val) => {
                let data = val.data();
                classdata = data;

                document.getElementById("name").innerText = data.name;

                let currentMem = data.members.find(item => item.email === user.email);

                if(!currentMem && data.creator !== user.email) {
                    if(data.inv_req) {
                        document.getElementById("request-access").classList.replace("hidden", "flex");

                        document.getElementById("req-close").onclick = () => {
                            document.getElementById("request-access").classList.replace("flex", "hidden");
                        }
                    } else {
                        document.getElementById("no-access").classList.replace("hidden", "flex");
                    }
                    return;
                }

                if(path === "members") {
                    document.getElementById("membersHolder").classList.replace("hidden", "grid");
    
                    if(data.members) {
                        data.members.forEach(mem => {
                            let div = document.createElement("div");
                            div.className = "p-1";
                            div.innerHTML = `
                            <p class="w-full p-2 bg-lime-200 rounded-md flex justify-between items-center">${mem.email}${data.creator === user.email ? `<i class="trash fi fi-sr-trash text-red-500 btn btn-ghost border-0 p-0 shadow-none hover:bg-transparent hover:text-red-600 text-lg"></i>` : ""}</p>
                            `;
    
                            if(data.creator === user.email) {
                                div.querySelector(".trash").onclick = async () => {
                                    if(confirm(`Are you sure you want to remove user '${mem.email}' ?`)) {
                                        await updateDoc(d, {
                                            members: arrayRemove({email: mem.email, role: mem.role})
                                        });
        
                                        location.reload();
                                    }
                                }
                            }
    
                            document.getElementById(`${mem.role}-empty`)?.remove();
    
                            document.getElementById(`${mem.role}-list`).append(div);
                        });
                    }

                    if(data.creator !== user.email) {
                        document.getElementById("add-mem-btn").classList.add("hidden");
                    } else {
                        document.getElementById("add-mem-btn").onclick = () => {
                            document.getElementById("add-mem-win").classList.replace("hidden", "flex");
                        }
            
                        document.getElementById("mem-close").onclick = () => {
                            document.getElementById("add-mem-win").classList.replace("flex", "hidden");
                        }
            
                        document.getElementById("add-mem").onclick = async () => {
                            let email = document.getElementById("email").value;
                            let role = document.getElementById("role").value;
                            await updateDoc(d, {
                                members: arrayUnion({email, role})
                            });
                            location.reload();
                        }
                    }
                } else if(path === "details") {
                    document.getElementById("detailsHolder").classList.replace("hidden", "flex");
    
                    document.getElementById("class-code").value = classid;

                    document.getElementById("share-code").onclick = () => {
                        navigator.share({
                            url: location.href,
                            title: `Join '${data.name}' classroom!`,
                            text: `Class-Code: ${classid}`
                        });
                    }

                    let qrImg = document.getElementById("qr-image");
                    document.getElementById("share-qr-btn").onclick = () => {
                        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${location.href}&&color=7ccf00&&bgcolor=ecfcca&&margin=3&&qzone=1`;
                        document.getElementById("qr-win").classList.replace("hidden", "flex");
                    }
        
                    document.getElementById("qr-close").onclick = () => {
                        document.getElementById("qr-win").classList.replace("flex", "hidden");
                    }
        
                    document.getElementById("share-qr-img").onclick = async () => {
                        let data = await imageUrlToFile(qrImg.src);
                        navigator.share({
                            files: [
                                data
                            ],
                            title: `Join '${data.name}' classroom!`,
                            text: `Class-Code: ${classid}`
                        })
                    }

                    if(data.creator === user.email) {
                        document.getElementById("leave-message").innerText = "Delete";
                        document.getElementById("leave-message").previousElementSibling.classList.replace("fi-sr-exit", "fi-sr-trash");
                        document.getElementById("leave-class").onclick = async () => {
                            if(confirm(`Are you sure you want to delete the classroom '${data.name}' ?`)) {
                                await deleteDoc(d);
                                window.open("/dashboard", "_self");
                            }
                        }

                        document.getElementById("settings").classList.replace("hidden", "block");
                        let req = document.getElementById("settings").querySelector("#inv-req");
                        if(data.inv_req) {
                            req.checked = data.inv_req;
                        }

                        req.onchange = async () => {
                            await updateDoc(d, {
                                inv_req: req.checked
                            });
                        }
                    } else {
                        document.getElementById("leave-class").onclick = async () => {
                            if(confirm(`Are you sure you want to leave the classroom '${data.name}' ?`)) {
                                await updateDoc(d, {
                                    members: arrayRemove(currentMem)
                                });
                                window.open("/dashboard", "_self");
                            }
                        }
                    }
                } else if(path === "updates") {
                    document.getElementById("updatesHolder").classList.replace("hidden", "flex");

                    const updatesRef = collection(d, "updates");
                    const updatesQuery = query(updatesRef, orderBy("createdAt", "desc"));

                    getDocs(updatesQuery).then(vals => {
                        let ups = vals.docs.map(d => ({ id: d.id, ...d.data() }));

                        ups.forEach(u => {
                            let div = document.createElement("div");
                            div.className = "border-2 border-lime-200 rounded-md";

                            let date = formatFirebaseTimestamp(u.createdAt);
                            div.innerHTML = `
                                <div class="p-3 border-b-2 border-lime-200 bg-lime-200 flex justify-between items-center">
                                    <p class="text-base text-lime-700">${u.creator} <span class="text-xs text-lime-800">( ${date} )</span></p>
                                    ${ u.creator === user.email ? `<span class="btn btn-ghost hover:bg-transparent border-0 shadow-none text-error hover:text-red-600 p-0 h-fit text-lg post-delete"><i class="fi fi-sr-trash"></i></span>` : "" }
                                </div>
                                <p class="text-sm text-lime-600 p-3">${u.message}</p>
                            `;

                            if (u.creator === user.email) {
                                div.querySelector(".post-delete").onclick = async () => {
                                    await deleteDoc(doc(updatesRef, u.id));
                                    location.reload();
                                };
                            }

                            document.getElementById("updates-list").append(div);
                        });
                    });

                    if(data.creator === user.email || currentMem.role === "teacher") {
                        let form = document.getElementById("publish-form");
                        form.classList.remove("hidden");

                        form.querySelector("#post-submit").onclick = async () => {
                            let message = form.querySelector("#message").value;
                            await addDoc(collection(d, "updates"), {
                                message: message,
                                creator: user.email,
                                createdAt: serverTimestamp()
                            });
                            location.reload();
                        }
                    }
                } else if(path === "quizzes") {
                    document.getElementById("quizzesHolder").classList.replace("hidden", "flex");

                    if(data.creator === user.email || currentMem.role === "teacher") {
                        document.getElementById("new-quiz-btn").onclick = () => {
                            const newUrl = `${location.origin}/classroom/${classid}/new-quiz`;
                            window.open(newUrl, "_self");
                        }
                        document.getElementById("quizzesHolder").querySelector(".teach").classList.replace("hidden", "flex");
                    } else {
                        
                        document.getElementById("quizzesHolder").querySelector(".student").classList.replace("hidden", "flex");
                    }

                    const updatesRef = collection(d, "quizzes");
                    const updatesQuery = query(updatesRef, orderBy("createdAt", "desc"));

                    getDocs(updatesQuery).then(vals => {
                        let quiz = vals.docs.map(d => ({ id: d.id, ...d.data() }));

                        quiz.forEach(u => {
                            let div = document.createElement("div");
                            div.className = " border-2 border-lime-900 rounded-md bg-lime-100 text-lime-900 btn btn-ghost hover:bg-transparent hover:shadow-xl shadow-lime-300 md:w-70 w-full transition-all h-70 flex flex-col justify-center items-center gap-2";
                            let date = u.deadline ? formatTimestamp(u.deadline) : null;

                            let attemped = u.responses ? u.responses.find(i => i===user.email) : false;
                            div.innerHTML= `
                                <p class=" border-b border-lime-900 pb-4 mb-2 w-[90%]">${u.name ?? "Quiz 1"}</p>
                                <p class="w-full border-b-0 border-lime-900 text-red-500 pb-4 mb-2">Deadline: <span id="deadline">${date ?? ""}</span></p>
                                <a href="/classroom/${classid}/quiz/${u.id}" ${attemped ? "disabled" : ""} ${u.deadline && Date.now() > u.deadline ? "disabled" : ""} id="edit-quiz-btn" class=" ${(u.deadline && Date.now() > u.deadline) || attemped ? "hidden" : "flex"} justify-center font-semibold  btn btn-success rounded-full gap-2 items-center px-10"><i class=" fi fi-sr-pen-nib"></i>${u.deadline && Date.now() > u.deadline ? "Ended" : `Attempt${attemped ? "ed" : ""}`}</a>
                                <button class=" ${(u.deadline && Date.now() > u.deadline) || attemped ? "flex" : "hidden"} justify-center font-semibold  btn btn-error rounded-full gap-2 items-center px-10"><i class=" fi fi-sr-pen-nib"></i>${u.deadline && Date.now() > u.deadline ? "Ended" : `Attempt${attemped ? "ed" : ""}`}</button>
                            `;

                            if (u.creator === user.email && (data.creator === user.email || currentMem.role === "teacher")) {
                                div.className = "border-2 border-lime-900 rounded-md bg-lime-100 text-lime-900 btn btn-ghost hover:bg-transparent hover:shadow-xl shadow-lime-300 md:w-70 w-full transition-all h-32 flex flex-col justify-center items-center gap-2";
                                div.innerHTML = `
                                    <p class="w-full border-b border-lime-900 pb-4 mb-2">${u.name ?? "Quiz 1"}</p>
                                    <div class="flex justify-center w-full gap-3">
                                        <a href="/classroom/${classid}/edit-quiz/${u.id}" id="edit-quiz-btn" class=" flex justify-center font-semibold  btn btn-success rounded-full  gap-2 items-center px-10"><i class=" fi fi-sr-edit"></i>Edit</a>
                                        <button id="delete-quiz-btn" class=" flex justify-center font-semibold  btn btn-error btn-circle rounded-full  gap-2 items-center"><i class=" fi fi-sr-trash"></i></button>
                                    </div>
                                `;

                                div.querySelector("#delete-quiz-btn").onclick = async () => {
                                    if(confirm(`Are you sure you want to delete the quiz '${u.name ?? "Quiz 1"}' ?`)) {
                                        await deleteDoc(doc(updatesRef, u.id));
                                        location.reload();
                                    }
                                };


                            }

                            document.getElementById(`${data.creator === user.email ? "teacher" : currentMem.role}-quiz`).append(div);
                        });
                    });
                }
            });
        }
    }
});

function signup() {
    let email = document.getElementById("email");
    let password = document.getElementById("password");

    if(location.pathname === "/login") {
        signInWithEmailAndPassword(auth, email.value, password.value);
    } else {
        createUserWithEmailAndPassword(auth, email.value, password.value);
    }
}

function formatFirebaseTimestamp(timestamp) {
    const date = timestamp.toDate(); // Convert Firestore Timestamp to JavaScript Date
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp); // Convert Firestore Timestamp to JavaScript Date
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

async function compare(res, ans, marks, details, ai=false) {
    if(details.type === "radio") {
        if(ans === res) {
            return marks;
        } else {
            return 0;
        }
    } else if(details.type === "text") {
        const maxLen = Math.max(ans.length, res.length);
        const distance = levenshteinDistance(ans.toLowerCase(), res.toLowerCase());
        const similarity = 1 - (distance / maxLen);
        return similarity * marks;
    } else if(details.type === "textarea") {
        if(ai) {
            let result = await fetch("/evaluate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: details.question,
                    answer: ans,
                    response: res,
                    marks: marks
                })
            });
            result = await result.json();
            if(result.status === 200) {
                return Number(result.content);
            } else {
                const maxLen = Math.max(ans.length, res.length);
                const distance = levenshteinDistance(ans.toLowerCase(), res.toLowerCase());
                const similarity = 1 - (distance / maxLen);
                return similarity * marks;   
            }
        } else {
            const maxLen = Math.max(ans.length, res.length);
            const distance = levenshteinDistance(ans.toLowerCase(), res.toLowerCase());
            const similarity = 1 - (distance / maxLen);
            return similarity * marks;
        }
    }
}

function levenshteinDistance(a, b) {
    const dp = Array(a.length + 1).fill(null).map(() =>
        Array(b.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1, 
                dp[i][j - 1] + 1, 
                dp[i - 1][j - 1] + cost 
            );
        }
    }
    return dp[a.length][b.length];
}

async function imageUrlToBlob(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return blob;
    } catch (error) {
        console.error("Error converting image URL to blob:", error);
    }
}

async function imageUrlToFile(url, filename = "classroom.png") {
    const blob = await imageUrlToBlob(url);
    return new File([blob], filename, { type: blob.type });
}

function getCurrentClassMember(d, user) {
    return new Promise((resolve, reject) => {
        getDoc(d).then((val) => {
            let data = val.data();
    
            let currentMem = data.members.find(item => item.email === user.email);

            resolve({ class: data, currentMem });
        }).catch(e => {
            resolve(null);
        });
    });
}