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
const divDummy = document.querySelector(".dummy-div");
const mainDivs = [divPalette, divResizer, divPickerHistory, divDummy];

const progressbar = document.querySelector("progress");
const downLoadImgLink = document.querySelector(".download-img-a");

const progressNumberFormat = new Intl.NumberFormat('en-EN', {maximumSignificantDigits: 1});
const screenshotFileName = 'page-screenshot';


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
let resultWindowId;

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
 * Checks if an array contains an object using a comparator function.
 *
 * @param {Array} arr - The array to check.
 * @param {Object} obj - The object to look for.
 * @param {Function} comparator - The comparator function to use.
 *                               Should accept two parameters: item (array element) and obj (search object),
 *                               and return a boolean indicating whether they match or not.
 * @return {boolean} - Returns true if the array contains the object, false otherwise.
 */
function arrayContainsObject(arr, obj, comparator) {
  return arr.some(item => comparator(item, obj));
}

/**
 * Checks if the sum of RGB values of two objects are equal.
 *
 * @param {Object} o1 - The first color object to compare.
 * @param {Object} o2 - The second color object to compare.
 * @param {number} o1.sum - The sum of RGB values of o1.
 * @param {number} o2.sum - The sum of RGB values of o2.
 * @return {boolean} Returns true if the sum of RGB values of o1 and o2 are equal, otherwise false.
 */
function isColorEqual(o1, o2) {
  return o1.sum === o2.sum;
}


/**
 * Create a color image based on an array of colors.
 *
 * @param {Array<string>} colors - An array of colors in hexadecimal notation.
 *        [
 *         color: {
 *           hex: '#0098db',
 *           rgba: '#0098db',
 *           sum: 678
 *         }, ...
 *      ]
 * @return {string} - The base64 encoded data URL of the generated image.
 */
function createColorImage(colors) {
  return createColorImageCanvas(colors).toDataURL('image/png');
}

/**
 * Draws a color box on a canvas context.
 *
 * @param {CanvasRenderingContext2D} imgContext - The canvas rendering context on which to draw the color box.
 * @param {object} color - The color object that contains the rgba and hex values of the color.
 * @param {number} x - The x-coordinate of the top-left corner of the color box.
 * @param {number} y - The y-coordinate of the top-left corner of the color box.
 * @param {number} color_box_width - The width of the color box.
 * @param {number} color_box_height - The height of the color box.
 */
function drawColorBox(imgContext, color, x, y, color_box_width, color_box_height) {
  imgContext.shadowBlur = 3;
  imgContext.shadowColor = 'rgba(0,0,0,0.5)';
  imgContext.fillStyle = color.rgba;
  imgContext.fillRect(x, y, color_box_width, color_box_height);
  imgContext.fillStyle = '#000';
  imgContext.textAlign = 'left';

  x = x + color_box_width + 20;
  imgContext.fillText(color.hex, x, y + 20);
  imgContext.fillText(color.rgba, x, y + 50);

  const [r, g, b, a] = getRgbArrFromRgbString(color.rgba);
  const oklch = rgb2oklch(r, g, b, a);
  const oklchStr = oklchToString(...oklch);
  const tw = hexToTailwind(color.hex);
  imgContext.fillText(oklchStr, x, y + 80);
  if (tw) {
    imgContext.fillText(tw, x, y  + 110);
  }
}

/**
 * Creates a color image canvas based on the given colors.
 *
 * @param {Array<Object>} colors - An array of color objects.
 * @property {string} colors[].hex - The hexadecimal representation of the color.
 * @property {string} colors[].rgba - The RGBA representation of the color.
 * @return {HTMLCanvasElement} The color image canvas.
 */
function createColorImageCanvas(colors) {
  const canvas = document.createElement('canvas');
  const numberOfColorBoxesPerRow = 3;
  const boxWidth = 100;
  const colorBoxHeight = 100;
  const paddingX = 400;
  const paddingY = 60;
  const totalRows = Math.ceil(colors.length / numberOfColorBoxesPerRow);
  const imageWidth = (boxWidth + paddingX) * numberOfColorBoxesPerRow;
  const imageHeight = ((colorBoxHeight + paddingY) * totalRows);

  window.devicePixelRatio = 2;
  canvas.height = imageHeight;
  canvas.width = imageWidth;
  const img = canvas.getContext('2d');

  if (img) {
    const imageData = img.createImageData(imageWidth, imageHeight);
    img.putImageData(imageData, 0, 0);
    img.fillStyle = 'white';
    img.fillRect(0, 0, imageWidth, imageHeight);
    img.font = 'normal 16pt sans-serif';

    let colorCounter = 0;
    for (let r = 0; r < totalRows; r++) {
      const co_y =  ((colorBoxHeight + paddingY) * r);
      for (let c = 0; c < numberOfColorBoxesPerRow; c++) {
        if (colorCounter === colors.length) {
          break;
        } else {
          const co_x =  ((paddingX + boxWidth) * c);
          drawColorBox(img, colors[colorCounter], co_x, co_y, boxWidth, colorBoxHeight);
          colorCounter++;
        }
      }
    }
  }
  return canvas;
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
 * Returns an array of unique colors from the given array of colors.
 *
 * @param {string[]} colors - The array of colors.
 * @returns {string[]} - An array of unique colors.
 */
const getUniqColors = (colors) => {
  const ret = [];
  for (const c of colors) {
    if (!arrayContainsObject(ret, c, isColorEqual)) {
      ret.push(c);
    }
  }
  return ret;
};

function getRgbArrFromRgbString(rgbString) {
  const rgbaRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(\.\d+)?))?\)/;
  const matches = rgbString.match(rgbaRegex);
  if (!matches) {
    throw new Error('Ungültiges RGB- oder RGBA-Format');
  }

  const [, r, g, b, a] = matches.map(Number); // ignore first match

  if (!isNaN(a)) {
    return [r, g, b, a];
  } else {
    return [r, g, b];
  }
}

/**
 * Generates an HTML string to render a list of colors.
 *
 * @param {Array} colors - An array of color objects.
 * @param {string} colors[].hex - The hexadecimal representation of the color.
 * @param {string} colors[].rgba - The RGBA representation of the color.
 * @returns {string} - The generated HTML string.
 */
const renderColors = (colors) => {
  const buf = [''];
  colors.forEach(color => {
    const [r, g, b, a] = getRgbArrFromRgbString(color.rgba);
    const oklch = rgb2oklch(r, g, b, a);
    const oklchStr = oklchToString(...oklch);
    const tw = hexToTailwind(color.hex);
    buf.push(`
        <div class="chip">
          <div 
              title="rgb: click, hex: shift+click, oklchStr: alt+click"
              class="colored-div" 
              data-color-1="${color.rgba}" 
              data-color-2="${color.hex}" 
              data-color-3="${oklchStr}" 
              data-color-4="${tw}" 
              style="background-color: ${color.rgba}"></div>
          <div class="color-box-text hex">${color.hex}</div>
          <div class="color-box-text rgb">${color.rgba}</div>
          <div class="color-box-text oklch">${oklchStr}</div>`);
    if (tw) {
      buf.push(`<div class="color-box-text tailwind">${tw}</div>`);
    }
    buf.push(`
        </div>
      `);
  });
  buf.push(`</div>`);
  return buf.join('');
};


/**
 * Function to grab colors and update the UI.
 *
 * @function grabColors
 * @returns {void}
 */
const grabColors = () => {
  setLabelText('');
  showDiv(divPalette);
  scrapColors().then(data => {
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

let rv = false;
function toogleRuler() {
  rv = !rv;
  showRuler(rv);
}
function showRuler(show) {
  if (show) {
    setLabelText('Ruler added.');
    showDiv(divDummy);
    document.querySelector('.rule-hidden-stroke-path').classList.remove('hidden');

    chrome.scripting.executeScript({
      target: {tabId: currentTab.id},
      files: ['js/inject/ruler.js'],
    }).then(()=>{
      chrome.tabs.sendMessage(currentTab.id, {type: 'ENABLE', value: true });
    })



  } else {
    setLabelText('');
    showDiv(divDummy);
    document.querySelector('.rule-hidden-stroke-path').classList.add('hidden');
    console.log('########################')
    chrome.tabs.sendMessage(currentTab.id, {type: 'ENABLE', value: false });
  }
}


/**
 * Renders colors on a specified div element and adds a click listener.
 *
 * @param {Array<string>} colors - An array of color values to render.
 * @param {HTMLElement} div - The target div element to render the colors on.
 * @return {void}
 */
function renderColorsOnDiv(colors, div){
  div.innerHTML = renderColors(colors);
  div
    .querySelectorAll('div[data-color-1]')
    .forEach(ele =>
      ele.addEventListener('click', (evt) => copyColor(ele, evt))
    );
}


/**
 * Copies the color value from the target element to the clipboard.
 *
 * @param {HTMLDivElement} colorDiv - The target of the click.
 */
function copyColor(colorDiv, evt) {
  const key = evt.shiftKey ? '2' : evt.altKey ? '3': '1';
  const color = colorDiv.getAttribute('data-color-' + key);
  navigator.clipboard.writeText(color).then(() => setLabelText(`"${color}" copied to clipboard.`));
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
 * Sets the visibility of the progress bar.
 *
 * @param {boolean} b - Specifies whether the progress bar should be visible or not.
 * @return {undefined}
 */
function setProgressbarVisible(b) {
  progressbar.value = 0;
  if (b) {
    progressbar.classList.remove('hidden');
  } else {
    progressbar.classList.add('hidden');
  }
}

/**
 * Updates the progress of capturing
 *
 * @param {number} f - The progress of capturing, between 0 and 1
 *
 * @return {void}
 */
function onProgress(f) {
  if (f >= 1) {
    divText.innerText = `Capturing... done`;
  } else {
    progressbar.value = f * 100;
    const n = progressNumberFormat.format(f * 100);
    divText.innerText = `Capturing... ${n}% `;
  }
}

/**
 * Sets the error message in the palette element.
 *
 * @param {string} err - The error message to display.
 */
function onError(err) {
  divPalette.innerHTML = `<span class="ge-error-color">${err}</span>`;
}

/**
 * Function to handle the completion of the screen capture task.
 *
 * @param {Array} filenames - Array of filenames representing the captured screens.
 * @param {number} index - Index indicating the current position in the filenames array. Defaults to 0.
 * @returns {void}
 */
function onCompleted(filenames, index) {
  setProgressbarVisible(false);
  if (!filenames.length) {
    console.error('Error: no screen captured!');
    return;
  }
  index = index || 0;

  const url = filenames[index];
  const last = index === filenames.length - 1;

  if (currentTab.incognito && index === 0) {
    // incognito -> non incognito
    chrome.windows.create({
      url: url,
      incognito: false,
      focused: last
    }, win => {
      resultWindowId = win.id;
    });
  } else {
    chrome.tabs.create({
      url: url,
      active: last,
      windowId: resultWindowId,
      openerTabId: currentTab.id,
      index: (currentTab.incognito ? 0 : currentTab.index) + 1 + index
    });
  }

  if (!last) {
    onCompleted(filenames, index + 1);
  }
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
  // btnRuler.addEventListener("click", showRuler);
  btnRuler.addEventListener("click", toogleRuler);

  btnToggleDesignMode.addEventListener("click", async () => {
    showDiv(divDummy);
    toggleDesignMode()
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
    const count = await cleanPage();
    setLabelText(`Items removed: ${count}`);
  });

  btnCaptureScreen.addEventListener("click", async () => {
    showDiv(divDummy);
    const onSplitting = console.warn;
    setProgressbarVisible(true);
    CaptureUtil.captureToFiles(currentTab, screenshotFileName, {onCompleted, onError, onProgress, onSplitting});
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
}

// Go:
go();


