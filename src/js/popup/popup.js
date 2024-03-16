import {initRuler, toogleRulerVisibility} from './ruler.js';
import {createColorImage, getUniqColors, renderColors, renderColorsOnDiv, scrapColors} from "./colors.js";
import {cleanPage} from "./cleaner.js";
import {toggleDesignMode} from "./design-mode.js";
import {updateWindow, windowSizes} from "./resizer.js";
import {CaptureUtil} from "./screen-capture.js";

// main actions:
const btnRescan = document.querySelector(".rescan-btn");
const btnEyeDropper = document.querySelector(".eyedropper-btn");
const btnCopyCustomProperties = document.querySelector(".copy-custom-properties-btn");
const btnRuler = document.querySelector(".ruler-btn");
const btnCaptureScreen = document.querySelector(".capture-screen-btn");
const btnCleaner = document.querySelector(".cleaner-btn");
const btnToggleDesignMode = document.querySelector(".toggle-designmode-btn");
const btnResizer = document.querySelector(".resizer-btn");

// light / dark
const btnToggleTheme = document.querySelector(".toggle-theme-btn");


// color actions:
const btnCopyImage = document.querySelector(".copy-img-btn");
const btnCopyValues = document.querySelector(".copy-values-btn");
const btnCopyHtml = document.querySelector(".copy-html-btn");


// divs:
const divText = document.querySelector(".text-div");

const divPalette = document.querySelector(".palette-div");
const divResizer = document.querySelector(".resizer-div");
const divPickerHistory = document.querySelector(".picker-div");
const divRuler = document.querySelector(".ruler-div");
const divDummy = document.querySelector(".dummy-div");
const mainDivs = [divPalette, divResizer, divPickerHistory, divDummy, divRuler];

const progressbar = document.querySelector("progress");
const downLoadImgLink = document.querySelector(".download-img-a");




let data = {
  currentTheme: 'light',
  visibleOnly: true
};
let displayInfo = [];

const pickerHistory = [];

let currentWindow;
let windowId;
let currentTab;
let grabbedData = {};
let currentColors = [];




/**
 * Stores data in Chrome Sync Storage.
 *
 * @param {any} data - The data to be stored.
 *
 * @return {void}
 */
function storeData() {
  chrome.storage.sync.set(data);
}


/**
 * Sets the text of a div element and applies an optional animation.
 *
 * @param {string} s - The text to set.
 * @param {string} [animation] - The animation class to apply (optional).
 * @return {void} - No return value.
 */
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




/**
 * Function to grab colors and update the UI.
 *
 * @function grabColors
 * @returns {void}
 */
const grabColors = (tabId) => {
  setLabelText('');
  showDiv(divPalette);
  scrapColors(currentTab.id).then(data => {
    grabbedData = data;
    const colors = getUniqColors(
      data
        .extractedColors
        .filter(
          item => !data.visibleOnly || item.visible
        )
        .map(item => item.bgColor)
        .concat(
          data.extractedColors
            .map(item => item.color)
        )
    ).sort((a, b) => a.sum - b.sum);

    currentColors = [...colors];
    renderColorsOnDiv(currentColors, divPalette);
    downLoadImgLink.setAttribute('href', createColorImage(colors));
  });
}





/**
 * Updates the HTML attribute 'data-theme' based on the current theme and toggles the icon on a button element.
 *
 * @return {undefined}
 */
function updateHtmlDataThemeAttributeAndToggleIcon() {
  btnToggleTheme.classList.remove('if');
  btnToggleTheme.classList.remove('else');
  btnToggleTheme.classList.add((data.currentTheme === 'dark') ? 'if' : 'else');

  document.querySelector('html').setAttribute('data-theme', data.currentTheme);
}

/**
 * Render the CSS custom property map.
 *
 * @return {string} The rendered CSS custom property map as a string.
 */
function renderCSSCustomPropertyMap() {
  const buf = [];
  const map = grabbedData.cssCustomProperties;
  const keys = Object.keys(map).sort();
  for (const key of keys) {
    const rules = map[key];
    buf.push(`${key} {`);
    const rulesKeys = Object.keys(rules).sort();
    for (const rk of rulesKeys) {
      buf.push('  ' + rk + ': ' + rules[rk] + ';')
    }
    buf.push('}');
  }
  return buf.join('\n');
}

const ALLOWED_URL_PATTERNS = ['http://*/*', 'https://*/*', 'ftp://*/*', 'file://*/*'];
const DISALLOWED_URL_REGEX = [/^https?:\/\/chrome.google.com\/.*$/];

/**
 * Checks if a given URL is allowed based on a set of patterns.
 *
 * @param {string} url - The URL to be checked.
 *
 * @return {boolean} - Returns true if the URL is allowed, otherwise false.
 */
function isUrlAllowed(url) {
  let regExp, index;
  for (index = DISALLOWED_URL_REGEX.length - 1; index >= 0; index--) {
    if (DISALLOWED_URL_REGEX[index].test(url)) {
      return false;
    }
  }
  for (index = ALLOWED_URL_PATTERNS.length - 1; index >= 0; index--) {
    regExp = new RegExp('^' + ALLOWED_URL_PATTERNS[index].replace(/\*/g, '.*') + '$');
    if (regExp.test(url)) {
      return true;
    }
  }
  return false;
}

/**
 * Set visibility of color action buttons based on the given div element.
 *
 * @param {HTMLElement} div - The div element to check visibility against.
 */
function setColorActionsVisibility(div) {
  const colorActionBtns = document.querySelectorAll('.color-action');
  if (div === divPickerHistory || div === divPalette) {
    colorActionBtns.forEach(ele => ele.classList.remove('hidden'));
  } else {
    colorActionBtns.forEach(ele => ele.classList.add('hidden'));
  }
}

/**
 * Show a specific div by removing the 'hidden' class and hiding all other divs.
 *
 * @param {HTMLElement} div - The div element to be shown.
 *
 * @return {void}
 */
function showDiv(div) {
  if (div===divDummy) {
    divDummy.innerText = '';
  }
  mainDivs.forEach(d => d.classList.add('hidden'));
  div.classList.remove('hidden');
  setColorActionsVisibility(div);
}

/**
 * Checks if the palette div is visible or hidden.
 *
 * @returns {boolean} - Whether the palette div is visible (false) or hidden (true).
 */
function isPalleteDivVisible(){
  return !divPalette.classList.contains('hidden');
}

/**
 * Checks if the picker history div is visible.
 *
 * @returns {boolean} - Indicates whether the picker history div is visible or not.
 */
function isPickerHistoryDivVisible(){
  return !divPickerHistory.classList.contains('hidden');
}

/**
 * Checks if the palette or picker history div is currently visible.
 *
 * @returns {boolean} Returns true if either the palette div or the picker history div is visible, otherwise returns false.
 */
function isPalleteOrPickerHistoryDivVisible(){
  return isPalleteDivVisible() || isPickerHistoryDivVisible();
}






/**
 * Convert a hexadecimal color code to RGB/RGBA format.
 *
 * @param {string} hex - The hexadecimal color code to convert.
 * @return {string} The RGB or RGBA value converted from the hexadecimal color code.
 */
function hexToRgb(hex)  {
  if (!hex.includes('#')) {
    return hex;
  }
  hex = hex.replace(/^#/, '');
  const length = hex.length;
  const hasAlpha = (length === 8 || length === 4);

  let [r, g, b, a] = hasAlpha ? [
    hex.substr(0, 2),
    hex.substr(2, 2),
    hex.substr(4, 2),
    hex.substr(6, 2)
  ] : [
    hex.substr(0, 2),
    hex.substr(2, 2),
    hex.substr(4, 2),
    'FF'
  ];
  [r, g, b, a] = [r, g, b, a].map(val => parseInt(val, 16));

  return  hasAlpha ? `rgba(${r}, ${g}, ${b}, ${a / 255})` : `rgb(${r}, ${g}, ${b})`;
}



/**
 * Attaches event listeners to various buttons and checkboxes.
 * @return {void}
 */
function initListener() {

  btnRescan.addEventListener("click", grabColors);
  btnRuler.addEventListener("click", () => {
    const vis = toogleRulerVisibility(currentTab.id);
    if (vis) {
      showDiv(divRuler);
      setLabelText("Ruler added.");

    } else {
      showDiv(divDummy);
      setLabelText("Ruler removed.");
    }
  });

  btnToggleDesignMode.addEventListener("click", async () => {
    showDiv(divDummy);
    toggleDesignMode(currentTab.id)
      .then(res => {
        setLabelText(`Design mode is ${res}`);
        btnToggleDesignMode.classList.remove('not-editable');
        btnToggleDesignMode.classList.remove('editable');
        btnToggleDesignMode.classList.add(res === 'on' ? 'editable' : 'not-editable');
      });
  });

  btnResizer.addEventListener("click", async () => {
    let maxWidth = 10240;
    let maxHeight = 4320;
    if (displayInfo.length) {
      for (const di of displayInfo) {
        if (di.activeState ==='active' ){
          maxWidth = di.workArea.width;
          maxHeight = di.workArea.height;
          break;
        }
      }
    }
    initDivResizer(maxWidth, maxHeight);
    showDiv(divResizer);
  });

  btnCleaner.addEventListener("click", async () => {
    showDiv(divDummy);
    const count = await cleanPage(currentTab.id);
    setLabelText(`Items removed: ${count}`);
  });

  btnCaptureScreen.addEventListener("click", async () => {
    showDiv(divDummy);
    CaptureUtil.captureToFiles(currentTab);
  });

  btnToggleTheme.addEventListener("click", async () => {
    data.currentTheme = data.currentTheme === 'light' ? 'dark' : 'light';
    updateHtmlDataThemeAttributeAndToggleIcon();
    storeData();
  });

  btnCopyValues.addEventListener("click", async () => {
    if (!isPalleteOrPickerHistoryDivVisible()) {
      showDiv(divPalette);
    }
    const colorArr = isPalleteDivVisible() ? currentColors : pickerHistory;
    console.log('currentColors', currentColors)
    console.log('pickerHistory', pickerHistory)
    const buf = [];
    for (const color of colorArr) {
      buf.push(`${color.rgba}`);
    }
    navigator.clipboard
      .writeText(buf.join('\n'))
      .then(() => setLabelText(`Data copied to clipboard.`));
  });

  btnCopyCustomProperties.addEventListener("click", async () => {

    const s = renderCSSCustomPropertyMap();
    showDiv(divDummy);
    divDummy.innerHTML = `
    <div>
      <pre>${s}</pre>
    </div>
    `;
    if (s) {
      navigator.clipboard
        .writeText(s)
        .then(() => setLabelText(`CSS color custom properties copied to clipboard.`));
    } else {
      setLabelText(`No CSS color custom properties found.`)
    }

  });

  btnCopyHtml.addEventListener("click", async () => {
    if (!isPalleteOrPickerHistoryDivVisible()) {
      showDiv(divPalette);
    }
    const box = isPalleteDivVisible() ? divPalette.innerHTML : divPickerHistory.innerHTML;
    const html = `
  <html lang="en" data-theme="light">
    <style>
      html, body {
          width: 600px;
      }
      .palette-div {
          width: 600px;
          display: grid;
          grid-gap: 16px;
          grid-template-columns: repeat(auto-fit, 100px);
      }
      .colored-div {
          width: 70px;
          height: 70px;
          border: 1px solid #000;
          border-radius: 2px;
      }
    </style>
    <body>
      <div class="palette-div">
        ${box}
      </div>   
      
      <hr>
      <pre>${renderCSSCustomPropertyMap()}</pre>
    </body>
  </html>
  `;

    navigator.clipboard
      .write([new ClipboardItem({
        'text/html': new Blob([html], {type: 'text/html'})
      })])
      .then(() => setLabelText(`HTML copied to clipboard.`));
  });

  btnCopyImage.addEventListener("click", async () => {
    if (!isPalleteOrPickerHistoryDivVisible()) {
      showDiv(divPalette);
    }
    const colorArr = isPalleteDivVisible() ? currentColors : pickerHistory;
    const canvas = createColorImageCanvas(colorArr);
    // Copy canvas to blob
    canvas.toBlob(blob => {
      // Create ClipboardItem with blob and it's type, and add to an array
      const data = [new ClipboardItem({[blob.type]: blob})];

      // Write the data to the clipboard
      navigator.clipboard
        .write(data)
        .then(() => setLabelText(`Image copied to clipboard.`));
    });
  });


  btnEyeDropper.addEventListener("click", async () => {
    divPalette.classList.add('hidden');
    const eyeDropper = new EyeDropper();
    eyeDropper
      .open()
      .then((result) => {
        showDiv(divPickerHistory);
        const color = result.sRGBHex;
        pickerHistory.push({hex: color, rgba: hexToRgb(color)});

        navigator.clipboard
          .writeText(color)
          .then(() => setLabelText(`${color} copied to clipboard.`));

        divPickerHistory.innerHTML = renderColors(pickerHistory);
        renderColorsOnDiv(pickerHistory, divPickerHistory);
      })
      .catch((e) => {
        console.error(e);
      });
  });
}

/**
 * Resizes the window based on the given element's data-width and data-height attributes.
 *
 * @param {Element} ele - The element containing the data-width and data-height attributes.
 * @returns {void}
 */
function resizeWindow(ele) {
  const width = parseInt(ele.getAttribute('data-width'));
  const height = parseInt(ele.getAttribute('data-height'));
  updateWindow(windowId, {width, height, top:0, left:0});
}

/**
 * Initializes the div resizer by generating the necessary HTML elements
 * and attaching event listeners for resizing the window.
 */
function initDivResizer(maxWidth, maxHeight) {
  const buf = [];
  const found = windowSizes.filter((ws)=> (ws.height===maxHeight && ws===maxWidth)).length===1;
  const sizes = found ?
    windowSizes :
    [...windowSizes, {width: maxWidth, height: maxHeight, label: 'Your screen'}];

  for (const ws of sizes) {
    if (ws.width <= maxWidth && ws.height <= maxHeight) {
      console.log(ws)
      buf.push(`
    <div class="resolution-div" data-width="${ws.width}" data-height="${ws.height}">
        <div class="resolution">${ws.width} × ${ws.height}</div>
        <div class="label">${ws.label}</div>
    </div>
    `);
    }
  }
  divResizer.innerHTML = buf.join('');
  divResizer
    .querySelectorAll('.resolution-div')
    .forEach(ele =>
      ele.addEventListener('click', () => resizeWindow(ele))
    );

  chrome.windows.onBoundsChanged.addListener((win) => {
    setLabelText(`Current size: ${win.width} × ${win.height}`, 'none');
  });
}


/**
 * Initializes the div cleaner component on the page.
 *
 * This method generates and inserts HTML elements into the divCleaner element,
 * including a heading, a checkbox, and a button. It also adds a click event listener
 * to the button to invoke the cleanPage() method when clicked.
 *
 * @returns {void} This method does not return anything.
 */
function initDivCleaner() {
  /*
  const buf = [];
    buf.push(`
  <h2>Page Cleaner</h2>
  
  <label class="container">
    <input type="checkbox" checked="checked">
    <span class="checkmark"></span> Images
  </label>
  
  <button class="btn cleaner-ok-btn">
     Clean
    <span popover>Start cleaning</span>
  </button>
    `);

  divCleaner.innerHTML = buf.join('');
  divCleaner
    .querySelectorAll('.cleaner-ok-btn')
    .forEach(ele =>
      ele.addEventListener('click', () => cleanPage({para:'test'}))
    );

   */
}


export async function initRulerListener(tabId) {
  try {
    return chrome.scripting.executeScript({
      target: {tabId},
      files: ['js/inject/ruler-listener.js']

    }).then((res) => {
      return res[0].result;
    });
  } catch (err) {
    console.error(`failed to execute script: ${err}`);
  }
}

/**
 * Executes the main logic of the application.
 * Retrieves the data from chrome storage and updates the UI accordingly.
 * Initializes the event listener and color grabbing functionality.
 *
 * @return {void}
 */
async function go() {

  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    currentTab = tab;

    currentWindow = await chrome.windows.getCurrent();
    windowId = currentWindow.id;

    if (!isUrlAllowed(tab.url)) {
      divPalette.innerHTML = `<span class="ge-error-color">Oops! It seems that this page is not allowed to be analyzed.</span>`;
      return;
    }
    chrome.storage
      .sync
      .get()
      .then((result) => {
        if (result) {
          data = Object.assign(data, result);
        }
        updateHtmlDataThemeAttributeAndToggleIcon();

        grabColors();
        initListener();
      });

    initDivCleaner();

  } catch (_e) {
    divPalette.innerHTML = `<span class="ge-error-color">Error! This page cannot be scripted.</span>`;
  }


  chrome.runtime.onMessage
    .addListener((message, sender, sendResponse) => {
      if (message.displayInfo) {
        displayInfo = message.displayInfo;
        sendResponse(true);
      }
    });
  chrome.runtime.sendMessage("requestDisplayInfo", () => {});


  await initRulerListener(currentTab.id);
  initRuler(currentTab.id);
}

// Go:
go();


