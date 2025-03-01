// Available languages (add more if needed)
const availableLanguages = {
    "English": "en_US",
    "Spanish": "es_ES",
    "French": "fr_FR",
    "German": "de_DE"
};

// Default language
let currentLanguage = "en_US";
let dictionary;

// Function to load the selected dictionary
function loadDictionary(language) {
    fetch(`dictionaries/${language}.aff`)
        .then(response => response.text())
        .then(affData => {
            fetch(`dictionaries/${language}.dic`)
                .then(response => response.text())
                .then(dicData => {
                    dictionary = new Typo(language, affData, dicData);
                    console.log(`Loaded dictionary: ${language}`);
                });
        });
}

// Load the default dictionary
loadDictionary(currentLanguage);

// Function to detect when a textbox is appended
function detectTextboxAppend() {
    const targetNode = document.querySelector('#canvas'); // Adjust this for the actual container
    const config = { childList: true, subtree: true };

    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList.contains('textbox')) {
                        console.log('New textbox added:', node);
                        enableSpellCheck(node);
                    }
                });
            }
        });
    });

    observer.observe(targetNode, config);
}

// Function to enable spell checking
function enableSpellCheck(textbox) {
    textbox.setAttribute('contentEditable', 'true'); // Make editable
    textbox.setAttribute('spellcheck', 'false'); // Disable built-in spell check

    textbox.addEventListener('input', () => checkSpelling(textbox));
    textbox.addEventListener('contextmenu', (event) => handleRightClick(event, textbox));
}

// Function to check spelling and underline mistakes
function checkSpelling(textbox) {
    if (!dictionary) return;

    let words = textbox.innerText.split(/\s+/);
    let correctedHTML = words
        .map(word => {
            if (dictionary && !dictionary.check(word)) {
                return `<span class="misspelled" style="text-decoration: underline red; cursor: pointer;" data-word="${word}">${word}</span>`;
            }
            return word;
        })
        .join(" ");

    textbox.innerHTML = correctedHTML;
}

// Function to handle right-click on misspelled words
function handleRightClick(event, textbox) {
    event.preventDefault(); // Stop the default right-click menu

    const selectedWord = event.target.getAttribute('data-word');
    if (!selectedWord) return;

    let suggestions = dictionary.suggest(selectedWord);
    if (suggestions.length === 0) suggestions = ["No suggestions"];

    showContextMenu(event, suggestions, event.target);
}

// Function to show the custom right-click menu
function showContextMenu(event, suggestions, wordElement) {
    let menu = document.getElementById("spellcheck-menu");
    if (!menu) {
        menu = document.createElement("div");
        menu.id = "spellcheck-menu";
        menu.style.position = "absolute";
        menu.style.background = "white";
        menu.style.border = "1px solid black";
        menu.style.padding = "5px";
        menu.style.zIndex = "1000";
        menu.style.boxShadow = "2px 2px 10px rgba(0,0,0,0.2)";
        document.body.appendChild(menu);
    }

    // Clear existing menu items
    menu.innerHTML = "";
    suggestions.forEach(suggestion => {
        let option = document.createElement("div");
        option.innerText = suggestion;
        option.style.cursor = "pointer";
        option.style.padding = "5px";
        option.onmouseover = () => (option.style.background = "#ddd");
        option.onmouseout = () => (option.style.background = "white");
        option.onclick = () => {
            wordElement.innerText = suggestion;
            menu.style.display = "none";
        };
        menu.appendChild(option);
    });

    // Position the menu
    menu.style.left = `${event.pageX}px`;
    menu.style.top = `${event.pageY}px`;
    menu.style.display = "block";

    // Hide menu when clicking elsewhere
    document.addEventListener("click", () => menu.style.display = "none", { once: true });
}

// Function to create a language selector dropdown
function createLanguageSelector() {
    let selector = document.createElement("select");
    selector.id = "language-selector";
    selector.style.position = "fixed";
    selector.style.top = "10px";
    selector.style.right = "10px";
    selector.style.padding = "5px";
    
    for (let [name, code] of Object.entries(availableLanguages)) {
        let option = document.createElement("option");
        option.value = code;
        option.innerText = name;
        selector.appendChild(option);
    }

    selector.value = currentLanguage;
    selector.addEventListener("change", (event) => {
        currentLanguage = event.target.value;
        loadDictionary(currentLanguage);
    });

    document.body.appendChild(selector);
}

// Initialize the script when the page loads
document.addEventListener('DOMContentLoaded', () => {
    createLanguageSelector();
    detectTextboxAppend();
});
