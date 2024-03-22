const btnClearCache = document.querySelector(".clear-cache-btn");
const divText = document.querySelector(".text-div");
const divClearCache = document.querySelector(".clear-cache-div");


const dataToRemove = {
  "appcache": true,
  "cache": true,
  "cacheStorage": true,
  "cookies": true,
  "downloads": true,
  "fileSystems": true,
  "formData": true,
  "history": true,
  "indexedDB": true,
  "localStorage": true,
  "passwords": false,
  "serviceWorkers": true,
  "webSQL": true
};

const checkboxes = [
  {id: "appcache", label: "App Cache", description: ""},
  {id: "cache", label: "Cache", description: ""},
  {id: "cacheStorage", label: "Cache Storage", description: ""},
  {id: "cookies", label: "Cookies", description: ""},
  {id: "downloads", label: "Downloads", description: ""},
  {id: "fileSystems", label: "File Systems", description: ""},
  {id: "formData", label: "Form Data", description: ""},
  {id: "history", label: "History", description: ""},
  {id: "indexedDB", label: "Indexed DB", description: ""},
  {id: "localStorage", label: "Local Storage", description: ""},
  {id: "passwords", label: "Passwords", description: ""},
  {id: "serviceWorkers", label: "Service Workers", description: ""},
  {id: "webSQL", label: "WebSQL", description: ""},
];

export async function prepareClearCachePanel() {
  setLabelText('');

  const result = await chrome.storage.sync.get('clearCache');
  if (result?.clearCache) {
    Object.assign(dataToRemove, result.clearCache);
  }

  const data = dataToRemove;
  const buf = [];
  for (const cb of checkboxes) {
    const checked = data[cb.id] ? ' checked="checked" ' : '';
    buf.push(`  
      <label class="container">${cb.label}
        <input type="checkbox" ${checked} data-id="${cb.id}" class="visible-only-input">
        <span class="checkmark"></span>
      </label>`);
  }

  const div = document.querySelector(".checkboxes-div");
  div.innerHTML = buf.join("");
  div.querySelectorAll("input.visible-only-input")
    .forEach(checkbox => {
      checkbox
        .addEventListener("change", evt => {
          const key = checkbox.getAttribute("data-id");
          dataToRemove[key] = checkbox.checked;
        });
    });
}



export function doClear() {
  btnClearCache.disabled = true;
  chrome.browsingData.remove({
    "since": 0
  }, dataToRemove, () => {
    btnClearCache.disabled = false;
    setLabelText(`Data cleared.`);
    divClearCache.classList.add('hidden');
    chrome.storage.sync.set({clearCache: dataToRemove});
  });
}

function setLabelText(s, animation) {
  divText.innerText = s;
  if (s) {
    if (!animation) {
      animation = 'animate__flash';
    }
    divText.className = 'text-div';
    setTimeout(() => {
      divText.classList.add("animate__animated");
      divText.classList.add(animation);
    }, 20);
  }
}

// init:
btnClearCache.addEventListener("click", doClear);