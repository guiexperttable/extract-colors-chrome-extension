import {initRuler, toogleRulerVisibility} from './ruler.js';
import {
  createColorImage,
  createColorImageCanvas,
  getUniqColors,
  renderColors,
  renderColorsOnDiv,
  scrapColors
} from "./colors.js";
import {cleanPage} from "./cleaner.js";
import {toggleDesignMode} from "./design-mode.js";
import {updateWindow, windowSizes} from "./resizer.js";
import {CaptureUtil} from "./screen-capture.js";
import {prepareClearCachePanel} from "./clean-cache.js";

// main actions:
const btnRescan = document.querySelector(".rescan-btn");
const btnEyeDropper = document.querySelector(".eyedropper-btn");
const btnCopyCustomProperties = document.querySelector(".copy-custom-properties-btn");
const btnRuler = document.querySelector(".ruler-btn");
const btnShowCaptureScreen = document.querySelector(".show-capture-screen-btn");

const btnCleaner = document.querySelector(".cleaner-btn");
const btnToggleDesignMode = document.querySelector(".toggle-designmode-btn");
const btnResizer = document.querySelector(".resizer-btn");
const btnShowClearCache = document.querySelector(".show-clear-cache-btn");

// light / dark
const btnToggleTheme = document.querySelector(".toggle-theme-btn");


// color actions:
const btnCopyImage = document.querySelector(".copy-img-btn");
const btnCopyValues = document.querySelector(".copy-values-btn");
const btnCopyHtml = document.querySelector(".copy-html-btn");


// divs:
const divText = document.querySelector(".text-div");

const divActions = document.querySelector(".actions-div");
const divPalette = document.querySelector(".palette-div");
const divResizer = document.querySelector(".resizer-div");
const divClearCache = document.querySelector(".clear-cache-div");
const divPickerHistory = document.querySelector(".picker-div");
const divRuler = document.querySelector(".ruler-div");
const divScreenCapture = document.querySelector(".screen-capture-div");
const divDummy = document.querySelector(".dummy-div");
const mainDivs = [divPalette, divResizer, divPickerHistory, divDummy, divRuler, divClearCache, divScreenCapture];
const downLoadImgLink = document.querySelector(".download-img-a");

const inputRemoveAds = document.querySelector('input[name="removeAds"]');
const selectMaxHeight = document.querySelector('select[name="maxHeight"]');
const selectFormat = document.querySelector('select[name="format"]');
const selectQuality = document.querySelector('select[name="quality"]');
const inputQuality = document.querySelector('.input-quality');
const btnCaptureScreen = document.querySelector(".do-capture-btn");




let data = {
  currentTheme: 'light',
  visibleOnly: true
};
let displayInfo = [];
let capturingOptions = {
  removeAds: false,
  maxHeight: 29696,
  format: 'png',
  quality: 92
};

const pickerHistory = [];

let currentWindow;
let windowId;
let currentTab;
let grabbedData = {};
let currentColors = [];




/**
 * Stores data in Chrome Sync Storage.
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
 * @function onGrabColorsButtonClicked
 * @returns {void}
 */
const onGrabColorsButtonClicked = (tabId) => {
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
 * Handles the click event on the ruler button.
 * Toggles the visibility of the ruler based on the current tab.
 *
 * @return {boolean} - Returns true if the ruler is currently visible, false otherwise.
 */
function onRulerButtonClicked() {
  const vis = toogleRulerVisibility(currentTab.id);
  if (vis) {
    showDiv(divRuler);
    setLabelText("Ruler added.");

  } else {
    showDiv(divDummy);
    setLabelText("Ruler removed.");
  }
}

/**
 * Function for handling the click event of the toggle design mode button.
 * @async
 * @function onToggleDesignModeButtonClicked
 * @returns {Promise<void>} A promise that resolves once the design mode is toggled and the UI is updated.
 */
async function onToggleDesignModeButtonClicked() {
  showDiv(divDummy);
  toggleDesignMode(currentTab.id).then(res => {
      setLabelText(`Design mode is ${res}`);
      btnToggleDesignMode.classList.remove("not-editable");
      btnToggleDesignMode.classList.remove("editable");
      btnToggleDesignMode.classList.add(res === "on" ? "editable" : "not-editable");
    });
}


/**
 * Handles the click event of the resizer button.
 *
 * Sets the maximum width and height for the div resizer based on the active display's work area.
 * Initializes the div resizer with the maximum width and height.
 * Shows the div resizer on the screen.
 *
 * @return {Promise<void>} A Promise that resolves when the div resizer is displayed.
 */
async function onResizerButtonClicked() {
  let maxWidth = 10240;
  let maxHeight = 4320;
  if (displayInfo.length) {
    for (const di of displayInfo) {
      if (di.activeState === "active") {
        maxWidth = di.workArea.width;
        maxHeight = di.workArea.height;
        break;
      }
    }
  }
  initDivResizer(maxWidth, maxHeight);
  showDiv(divResizer);
}

function onShowClearCacheButtonClicked(){
  prepareClearCachePanel();
  showDiv(divClearCache);
}

/**
 * Handles the click event of the "Cleaner" button.
 * It shows a specified div, cleans the current page, and sets the label text with the number of items removed.
 *
 * @returns {Promise<number>} The number of items removed from the page.
 */
async function onCleanerButtonClicked() {
  showDiv(divDummy);
  const count = await cleanPage(currentTab.id);
  setLabelText(`Items removed: ${count}`);
}





async function onShowCaptureScreenButtonClicked() {
  const result = await chrome.storage.sync.get('capturing');
  if (result?.capturing) {
    Object.assign(capturingOptions, result.capturing);
  }

  inputRemoveAds.checked = (capturingOptions.removeAds);
  selectMaxHeight.value = capturingOptions.maxHeight;
  selectFormat.value = capturingOptions.format;
  selectQuality.value = capturingOptions.quality;
  if (selectFormat.value==='png'){
    inputQuality.classList.add('hidden');
  } else {
    inputQuality.classList.remove('hidden');
  }

  showDiv(divScreenCapture);
}

async function onCaptureScreenButtonClicked() {
  capturingOptions.removeAds = inputRemoveAds.checked;
  capturingOptions.maxHeight = parseInt(selectMaxHeight.value);
  capturingOptions.format = selectFormat.value;
  capturingOptions.quality = parseInt(selectQuality.value);
  await chrome.storage.sync.set({capturing: capturingOptions});

  if (capturingOptions.removeAds){
    setLabelText(`Cleaning...`);
    const count = await cleanPage(currentTab.id);
    setLabelText(`Items removed: ${count}`);
  }

  CaptureUtil.captureToFiles(currentTab, capturingOptions);
}


/**
 * Toggles the theme and performs necessary actions when the theme toggle button is clicked.
 * Updates the current theme, updates HTML data-theme attribute, toggles the theme icon, and stores the updated data.
 *
 * @returns {void}
 */
async function onToggleThemeButtonClicked() {
  data.currentTheme = data.currentTheme === "light" ? "dark" : "light";
  updateHtmlDataThemeAttributeAndToggleIcon();
  storeData();
}


/**
 * Executes when the user clicks on the "Copy Values" button.
 * Copies the color values to the clipboard.
 * If the palette or picker history div is not visible, it shows the palette div.
 *
 * @async
 * @returns {Promise<void>} Returns a promise that resolves when the operation is completed.
 */
async function onCopyValuesButtonClicked() {
  if (!isPalleteOrPickerHistoryDivVisible()) {
    showDiv(divPalette);
  }
  const colorArr = isPalleteDivVisible() ? currentColors : pickerHistory;
  const buf = [];
  for (const color of colorArr) {
    buf.push(`${color.rgba}`);
  }
  navigator.clipboard
    .writeText(buf.join("\n"))
    .then(() => setLabelText(`Data copied to clipboard.`));
}

/**
 * Copies CSS color custom properties to clipboard and displays them on the page.
 *
 * @returns {Promise<void>} A promise that resolves when the custom properties are copied to clipboard.
 */
async function onCopyCustomPropertiesClicked() {
  const s = renderCSSCustomPropertyMap();
  showDiv(divDummy);
  divDummy.innerHTML = `
    <div class="overflow-x-clip">
      <pre>${s}</pre>
    </div>
    `;
  if (s) {
    navigator.clipboard
      .writeText(s)
      .then(() => setLabelText(`CSS color custom properties copied to clipboard.`));
  } else {
    setLabelText(`No CSS color custom properties found.`);
  }
}


/**
 * Copies the HTML content of a palette or picker history div to the clipboard.
 *
 * @async
 * @function onCopyHtmlButtonClicked
 * @returns {Promise<void>} Promise that resolves when the HTML is copied to the clipboard.
 */
async function onCopyHtmlButtonClicked() {
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
      "text/html": new Blob([html], {type: "text/html"})
    })])
    .then(() => setLabelText(`HTML copied to clipboard.`));
}


/**
 * Handles the event when the "Copy Image" button is clicked.
 * If the palette or picker history div is not visible, it will be displayed.
 * Creates a canvas with the current colors or picker history.
 * Copies the canvas as an image to the clipboard.
 */
async function onCopyImageButtonClicked() {
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
}


/**
 * Handle the click event of the eye dropper button.
 * Hide the palette, open the eye dropper, and perform actions based on the result.
 * @async
 * @function onEyeDropperButtonClicked
 *
 * @returns {Promise<void>} - A promise that resolves when all actions are completed.
 */
async function onEyeDropperButtonClicked() {
  divPalette.classList.add("hidden");
  const eyeDropper = new EyeDropper();
  eyeDropper
    .open()
    .then((result) => {
      showDiv(divPickerHistory);
      const color = result.sRGBHex;
      const alreadyPicked = pickerHistory.filter(c => c.hex === color).length;
      if (!alreadyPicked) {
        pickerHistory.push({hex: color, rgba: hexToRgb(color)});
      }

      navigator.clipboard
        .writeText(color)
        .then(() => setLabelText(`${color} copied to clipboard.`));

      divPickerHistory.innerHTML = renderColors(pickerHistory);
      renderColorsOnDiv(pickerHistory, divPickerHistory);
    })
    .catch((e) => {
      console.error(e);
    });
}


/**
 * Initializes the event listeners for various buttons.
 *
 * @return {void}
 */
function initListener() {
  btnRescan.addEventListener("click", onGrabColorsButtonClicked);
  btnRuler.addEventListener("click", onRulerButtonClicked);
  btnToggleDesignMode.addEventListener("click", onToggleDesignModeButtonClicked);
  btnResizer.addEventListener("click", onResizerButtonClicked);
  btnShowClearCache.addEventListener("click", onShowClearCacheButtonClicked);
  btnCleaner.addEventListener("click", onCleanerButtonClicked);
  btnShowCaptureScreen.addEventListener("click", onShowCaptureScreenButtonClicked);
  btnCaptureScreen.addEventListener("click", onCaptureScreenButtonClicked);

  btnToggleTheme.addEventListener("click", onToggleThemeButtonClicked);
  btnCopyValues.addEventListener("click", onCopyValuesButtonClicked);
  btnCopyCustomProperties.addEventListener("click", onCopyCustomPropertiesClicked);
  btnCopyHtml.addEventListener("click", onCopyHtmlButtonClicked);
  btnCopyImage.addEventListener("click", onCopyImageButtonClicked);
  btnEyeDropper.addEventListener("click", onEyeDropperButtonClicked);

  document
    .querySelectorAll('.activable')
    .forEach(ele => {
      ele.addEventListener("click", evt => {
        document.querySelectorAll('.activable').forEach(
          e => e.classList.remove('active')
        );
        ele.classList.add('active');
      });
    });

  selectFormat.addEventListener("change", evt => {
    if (selectFormat.value === "png") {
      inputQuality.classList.add("hidden");
    } else {
      inputQuality.classList.remove("hidden");
    }
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

function initDisplayMessageListener() {
  chrome.runtime.onMessage
    .addListener((message, sender, sendResponse) => {
      if (message.displayInfo) {
        displayInfo = message.displayInfo;
        sendResponse(true);
      }
    });
  chrome.runtime.sendMessage("requestDisplayInfo", () => {
  });
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
    if (!isUrlAllowed(tab.url)) {
      divPalette.innerHTML = ``;
      divActions.innerHTML = '';
      return;
    }

    // normal Start:
    currentTab = tab;
    divPalette.innerHTML = '';
    currentWindow = await chrome.windows.getCurrent();
    windowId = currentWindow.id;

    const result = await chrome.storage.sync.get();
    if (result){
      data = Object.assign(data, result);
    }

    updateHtmlDataThemeAttributeAndToggleIcon();
    onGrabColorsButtonClicked();
    initListener();

    initDisplayMessageListener();

    await initRulerListener(currentTab.id);
    await initRuler(currentTab.id);

  } catch (e) {
    divText.innerHTML = `<span class="ge-error-color">Oops! It seems that this page is not allowed to be analyzed.</span>`;
    divPalette.innerHTML = e;
    divActions.innerHTML = '';
  }
}

// Go:
go();


