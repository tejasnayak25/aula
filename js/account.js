// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, getIdToken } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
// import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "firebase/auth";
// import { getFirestore, doc, getDoc, getDocs, onSnapshot, query, deleteDoc, addDoc } from "firebase/firestore";
import { getFirestore, doc, getDoc, getDocs, query, collection, where, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc, setDoc, addDoc, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { ref, getStorage, uploadBytes, getDownloadURL, listAll, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";
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
            
            const classroomsQuery = query(
                collection(firestore, "classrooms"), // Reference the "classrooms" collection
                where("creator", "==", user.email) // Filter by creator's email
            );
            
            // Fetch data once
            getDocs(classroomsQuery).then((snapshot) => {
                let classrooms = []; // Initialize array to store classrooms
            
                snapshot.forEach((doc) => {
                    let data = { id: doc.id, ...doc.data() };
                    classrooms.push(data);
            
                    let div = document.createElement("div");
                    div.className =
                        "cont h-fit rounded-lg bg-lime-200 border-2 border-lime-300 shadow-none shadow-lime-500 hover:shadow-lg transition-all text-slate-800";
                    div.innerHTML = `
                    <h1 class="pt-12 p-4 text-2xl font-bold ">${data.name}</h1>
                    <p class="p-4 pt-0 text-sm">${data.description ?? "No description yet!"}</p>
                    <a href="/classroom/${data.id}" class="pt-0 p-4 flex gap-1 hover:gap-2 text-lime-700 btn btn-ghost w-fit hover:bg-transparent border-0 shadow-none">
                        Edit 
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
                            <p class="w-full p-2 bg-lime-200 rounded-md flex justify-between items-center">${mem.email}<i class="trash fi fi-sr-trash text-red-500 btn btn-ghost border-0 p-0 shadow-none hover:bg-transparent hover:text-red-600 text-lg"></i></p>
                            `;
    
                            div.querySelector(".trash").onclick = async () => {
                                if(confirm(`Are you sure you want to remove user '${mem.email}' ?`)) {
                                    await updateDoc(d, {
                                        members: arrayRemove({email: mem.email, role: mem.role})
                                    });
    
                                    location.reload();
                                }
                            }
    
                            document.getElementById(`${mem.role}-empty`)?.remove();
    
                            document.getElementById(`${mem.role}-list`).append(div);
                        });
                    }
        
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
                                <div class="p-3 border-b-2 border-lime-200 flex justify-between items-center">
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
                    const updatesRef = collection(d, "quizzes");
                    const updatesQuery = query(updatesRef, orderBy("createdAt", "desc"));

                    getDocs(updatesQuery).then(vals => {
                        let quiz = vals.docs.map(d => ({ id: d.id, ...d.data() }));

                        quiz.forEach(u => {
                            let div = document.createElement("div");
                            div.className = "border-2 border-lime-200 rounded-md";
                            let date = formatFirebaseTimestamp(u.createdAt);
                            div.innerHTML = `
                                <div class="p-3 border-b-2 border-lime-200 flex justify-between items-center">
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