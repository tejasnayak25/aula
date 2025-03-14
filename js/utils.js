class HTMLNode {
    constructor({ tagName, attributes = {}, children = [], innerText = null, innerHTML = null }) {
        this.tagName = tagName;
        this.attributes = attributes;
        this.children = children;
        this.innerText = innerText;
        this.innerHTML = innerHTML;

        let tag = document.createElement(this.tagName);
        this.tag = tag;
        this.onappend = () => {}
    }

    append(...nodes) {
        this.children.push(...nodes);
    }

    _onappend() {
        this.onappend();
        for (const child of this.children) {
            child._onappend();
        }
    }

    get outerHTML() {
        let tag = this.element;
        return tag.outerHTML;
    }

    get element() {
        Object.entries(this.attributes).forEach(([ key, value ]) => {
            this.tag.setAttribute(key, value);
        });
        if(this.innerText) {
            this.tag.innerText = this.innerText;
        }
        for (const i of this.children) {
            this.tag.append(i.element);
        }
        if(this.innerHTML) {
            this.tag.innerHTML = this.innerHTML;
        }
        return this.tag;
    }
}

function getRadio(opts, id, debug) {
    let html = "";

    if(!opts && debug) {
        opts = [ "Option 1" ];
    } else {
        return "";
    }

    opts.forEach(opt => {
        html += `
        <div class="flex items-center mb-6">
            <input checked id="${id}-response" type="radio" value="" name="${id}-response" class="w-4 h-4  radio text-lime-600 bg-lime-100 border-lime-300 focus:ring-lime-500 focus:ring-2">
            <label ${debug ? `contenteditable=""` : ""} for="${id}-response" class="ms-2 text-sm font-medium">${opt}</label>
        </div>
    `;
    });
    return html;
}

class Radio {
    constructor({ label, id, required = false, type, data = null, debug = false, onchange = (e, input) => {}, ondelete = () => {} }) {
        let div = new HTMLNode({
            tagName: "div",
            attributes: {
                id: id,
                class: "border-2 shadow shadow-lime-200 rounded-md border-lime-300 p-2"
            }
        });

        div.props = { question: label, type: type, id };

        div.innerHTML = `
                <div class="flex items-center justify-between">
                    <p class="question text-base  p-3 " ${debug ? `contenteditable=""` : ""}>${label} ${required ? "*" : ""}</p>
                    ${debug ? `
                    <select id="type-choose" class="select bg-transparent outline-lime-300 border-lime-300 ring-lime-300 border-2">
                        <option value="text">Short Text</option>
                        <option value="textarea">Long Text</option>
                        <option value="radio">Radio</option>
                    </select>    
                    ` : ""}
                </div>
                <div class="data p-5 py-5">  
                    <input type="text" id="class-code" class="bg-transparent border-1 w-full focus:border-2 border-lime-300 text-gray-900 text-sm rounded-lg block p-2.5 outline-0 mb-4" placeholder="Enter something..." />
                </div>
                ${
                    debug ? `
                    <div class=" flex p-3 gap-3 justify-end">
                        <div class=" flex justify-between items-center gap-3 px-3 border-r-1 border-lime-400">
                            <p>Required</p>
                            
                            <label class="inline-flex items-center cursor-pointer">
                                <input id="inp-required" type="checkbox" value="" class="sr-only peer">
                                <div class="relative w-11 h-6 bg-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lime-300 dark:peer-focus:ring-lime-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-lime-200 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-300"></div>
                            </label>
                        </div>

                        <div class=" pl-3 border-r-0 border-lime-400">
                            <i class=" fi fi-br-copy-alt text-lime-500 btn btn-ghost border-0 p-0 shadow-none hover:bg-transparent hover:text-lime-600 text-xl"></i>
                        </div>
                        <div class=" px-3 border-r-0 border-lime-400">
                            <i id="delete" class=" fi fi-sr-trash text-red-500 btn btn-ghost border-0 p-0 shadow-none hover:bg-transparent hover:text-red-600 text-xl"></i>
                        </div>
                    </div>
                    ` : ""
                }
        `;

        div.onappend = () => {

            if(debug) {
                if(type === "radio") {
                    let host = document.getElementById(id);
                    let addopt = host.querySelector("#add-opt");
                    addopt.onclick = () => {
                        let div = document.createElement("div");
                        div.className = "flex items-center mb-6 relative max-w-48";
                        div.innerHTML = `
                            <input checked id="option-1" type="radio" value="" name="default-radio" class="w-4 h-4  radio text-lime-600 bg-lime-100 border-lime-300 focus:ring-lime-500 focus:ring-2">
                            <label ${debug ? `contenteditable=""` : ""} for="default-radio-1" class="ms-2 text-sm font-medium">New Option</label>
                            ${debug ? `<i class=" absolute right-3 fi fi-sr-cross text-red-500 btn btn-ghost border-0 p-0 shadow-none hover:bg-transparent hover:text-red-600 text-sm"></i>` : ""}
                        `;

                        div.lastElementChild.onclick = () => {
                            div.remove();
                        }

                        addopt.before(div);
                    }
                }

                let host = document.getElementById(id);
                let type_choose = host.querySelector(`#type-choose`);
                type_choose.onchange = () => {
                    let val = type_choose.value;
                    type = val;
                    div.props.type = val;

                    if(val === "radio") {
                        host.querySelector(".data").innerHTML = `
                            ${ getRadio(data, id, debug) }
                            ${ debug ? `<p id="add-opt" class="text-sm flex justify-start items-center gap-3 btn btn-ghost hover:bg-transparent shadow-none border-0 p-0 hover:text-slate-800"><i class="fi fi-sr-plus"></i> Add Option</p>` : "" }
                        `;
                    } else if(val === "text") {
                        host.querySelector(".data").innerHTML = `
                            <input type="text" id="${id}-response" class="bg-transparent border-1 w-full focus:border-2 border-lime-300 text-gray-900 text-sm rounded-lg block p-2.5 outline-0 mb-4" placeholder="Enter something..." />
                        `;
                    } else if(val === "textarea") {
                        host.querySelector(".data").innerHTML = `
                            <textarea id="${id}-response" class="bg-transparent border-1 w-full focus:border-2 border-lime-300 text-gray-900 text-sm rounded-lg block p-2.5 outline-0 mb-4" placeholder="Enter something..."></textarea>
                        `;
                    }

                    div._onappend();
                }

                div.props.required = false;

                host.querySelector("#inp-required").onchange = () => {
                    div.props.required = host.querySelector("#inp-required").checked;
                }

                host.querySelector("#delete").onclick = () => {
                    host.remove();
                    ondelete();
                }
            } else {
                let host = document.getElementById(id);

                if(type === "radio") {
                    let d = getRadio(data, id, false);
                    console.log(d);
                    host.querySelector(".data").innerHTML = `
                        ${ d }
                        ${ debug ? `<p id="add-opt" class="text-sm flex justify-start items-center gap-3 btn btn-ghost hover:bg-transparent shadow-none border-0 p-0 hover:text-slate-800"><i class="fi fi-sr-plus"></i> Add Option</p>` : "" }
                    `;
                } else if(type === "text") {
                    host.querySelector(".data").innerHTML = `
                        <input type="text" id="${id}-response" class="bg-transparent border-1 w-full focus:border-2 border-lime-300 text-gray-900 text-sm rounded-lg block p-2.5 outline-0 mb-4" placeholder="Enter something..." />
                    `;
                } else if(type === "textarea") {
                    host.querySelector(".data").innerHTML = `
                        <textarea id="${id}-response" class="bg-transparent border-1 w-full focus:border-2 border-lime-300 text-gray-900 text-sm rounded-lg block p-2.5 outline-0 mb-4" placeholder="Enter something..."></textarea>
                    `;
                }
            }


            // input.onchange = (e) => {
            //     onchange(e, input);
            // }
        }

        return div;
    }
}