const btnCaptureScreen = document.querySelector(".capture-screen-btn");
const btnCleaner = document.querySelector(".cleaner-btn");
const btnToggleTheme = document.querySelector(".toggle-theme-btn");
const btnToggleDesignMode = document.querySelector(".toggle-designmode-btn");

const btnResizer = document.querySelector(".resizer-btn");
const btnCopyImage = document.querySelector(".copy-img-btn");
const btnCopyValues = document.querySelector(".copy-values-btn");
const btnCopyHtml = document.querySelector(".copy-html-btn");
const btnCopyRules = document.querySelector(".copy-rules-btn");
const btnEyeDropper = document.querySelector(".eyedropper-btn");
const divText = document.querySelector(".text-div");

const divPalette = document.querySelector(".palette-div");
const divResizer = document.querySelector(".resizer-div");
const divPickerHistory = document.querySelector(".picker-div");
const mainDivs = [divPalette, divResizer, divPickerHistory];

const progressbar = document.querySelector("progress");
const downLoadImgLink = document.querySelector(".download-img-a");

const progressNumberFormat = new Intl.NumberFormat('en-EN', {maximumSignificantDigits: 1});
const screenshotFileName = 'page-screenshot';


let data = {
  currentTheme: 'light',
  visibleOnly: true
};

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
  imgContext.shadowColor = 'rgba(0,0,0,0.3)';
  imgContext.fillStyle = color.rgba;
  imgContext.fillRect(x, y, color_box_width, color_box_height);
  imgContext.fillStyle = '#000';
  imgContext.textAlign = 'center';
  imgContext.fillText(color.hex, x + (color_box_width / 2), y + color_box_height + 20);
  imgContext.fillText(color.rgba, x + (color_box_width / 2), y + color_box_height + 50);
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
  const numberOfColorBoxesPerRow = 5;
  const boxWidth = 140;
  const colorBoxHeight = 100;
  const padding = 20;
  const totalRows = Math.ceil(colors.length / numberOfColorBoxesPerRow);
  const imageWidth = ((boxWidth + (padding * 2)) * numberOfColorBoxesPerRow) + (padding * 2);
  const imageHeight = ((colorBoxHeight + (padding * 2) + 60) * totalRows) + (padding * 2);

  window.devicePixelRatio = 2;
  canvas.height = imageHeight;
  canvas.width = imageWidth;
  const img = canvas.getContext('2d');

  if (img) {
    const imageData = img.createImageData(imageWidth, imageHeight);
    img.putImageData(imageData, 0, 0);
    img.fillStyle = 'white';
    img.fillRect(0, 0, imageWidth, imageHeight);
    img.font = 'bold 16pt serif';

    let colorCounter = 0;
    for (let r = 0; r < totalRows; r++) {
      const co_y = padding * 2 + ((((padding * 2) + colorBoxHeight) + 60) * r);
      for (let c = 0; c < numberOfColorBoxesPerRow; c++) {
        if (colorCounter === colors.length) {
          break;
        } else {
          const co_x = padding * 2 + (((padding * 2) + boxWidth) * c);
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
    buf.push(`
        <div class="chip">
          <div class="colored-div" data-color="${color.rgba}" style="background-color: ${color.rgba}"></div>
          <div class="color-box-text hex">${color.hex}</div>
          <div class="color-box-text rgb">${color.rgba}</div>
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
    divPalette.innerHTML = renderColors(colors);
    divPalette
      .querySelectorAll('div[data-color]')
      .forEach(ele =>
        ele.addEventListener('click', () => copyColor(ele))
      );
    downLoadImgLink.setAttribute('href', createColorImage(colors));
  });
}


/**
 * Copies the color value from the target element to the clipboard.
 *
 * @param {HTMLDivElement} colorDiv - The target of the click.
 */
function copyColor(colorDiv) {
  const color = colorDiv.getAttribute('data-color');
  navigator.clipboard.writeText(color).then(() => setLabelText(`${color} copied to clipboard.`));
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
  let keys = Object.keys(map).sort();
  for (const key of keys) {
    const rules = map[key];
    buf.push(`${key} {`);
    let rulesKeys = Object.keys(rules).sort();
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

function showDiv(div) {
  mainDivs.forEach(d => d.classList.add('hidden'));
  div.classList.remove('hidden');
}


function setProgressbarVisible(b) {
  progressbar.value = 0;
  if (b) {
    progressbar.classList.remove('hidden');
  } else {
    progressbar.classList.add('hidden');
  }
}

function onProgress(f) {
  if (f >= 1) {
    divText.innerText = `Capturing... done`;
  } else {
    progressbar.value = f * 100;
    const n = progressNumberFormat.format(f * 100);
    divText.innerText = `Capturing... ${n}% `;
  }
}

function onError(err) {
  divPalette.innerHTML = `<span class="ge-error-color">${err}</span>`;
}

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
 * Attaches event listeners to various buttons and checkboxes.
 * @return {void}
 */
function initListener() {

  // btnOk.addEventListener("click", grabColors);

  btnToggleDesignMode.addEventListener("click", async () => {
    toggleDesignMode()
      .then(res => {
        setLabelText(`Design mode is ${res}`);
        btnToggleDesignMode.classList.remove('not-editable');
        btnToggleDesignMode.classList.remove('editable');
        btnToggleDesignMode.classList.add(res === 'on' ? 'editable' : 'not-editable');
      });
  });

  btnResizer.addEventListener("click", async () => {
    showDiv(divResizer);
  });

  btnCleaner.addEventListener("click", async () => {
    const count = await cleanPage();
    setLabelText(`Items removed: ${count}`);
    // showDiv(divCleaner);
  });

  btnCaptureScreen.addEventListener("click", async () => {
    showDiv(divPalette);
    const onSplitting = console.warn;
    setProgressbarVisible(true);
    CaptureUtil.captureToFiles(currentTab, screenshotFileName, onCompleted, onError, onProgress, onSplitting);
  });

  btnToggleTheme.addEventListener("click", async () => {
    data.currentTheme = data.currentTheme === 'light' ? 'dark' : 'light';
    updateHtmlDataThemeAttributeAndToggleIcon();
    storeData();
  });

  btnCopyValues.addEventListener("click", async () => {
    showDiv(divPalette);
    const buf = [];
    for (const color of currentColors) {
      buf.push(`${color.rgba}`);
    }
    navigator.clipboard
      .writeText(buf.join('\n'))
      .then(() => setLabelText(`Data copied to clipboard.`));
  });

  btnCopyRules.addEventListener("click", async () => {
    showDiv(divPalette);
    const s = renderCSSCustomPropertyMap();
    if (s) {
      navigator.clipboard
        .writeText()
        .then(() => setLabelText(`CSS color custom properties copied to clipboard.`));
    } else {
      setLabelText(`No CSS color custom properties found.`)
    }

  });

  btnCopyHtml.addEventListener("click", async () => {
    showDiv(divPalette);
    const box = document.querySelector('.palette-div').innerHTML;
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
    showDiv(divPalette);
    const canvas = createColorImageCanvas(currentColors);
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


  btnEyeDropper.addEventListener("click", async () => {
    divPalette.classList.add('hidden');
    const eyeDropper = new EyeDropper();
    eyeDropper
      .open()
      .then((result) => {
        showDiv(divPickerHistory);
        const color = result.sRGBHex;
        if (!pickerHistory.includes(color)) {
          pickerHistory.push(color);
        }
        navigator.clipboard
          .writeText(color)
          .then(() => setLabelText(`${color} copied to clipboard.`));

        const colors = pickerHistory.map(c => {
          return {rgba: hexToRgb(c), hex: c};
        });
        divPickerHistory.innerHTML = renderColors(colors);
        divPickerHistory
          .querySelectorAll('div[data-color]')
          .forEach(ele =>
            ele.addEventListener('click', () => copyColor(ele))
          );
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
  updateWindow(windowId, {width, height});
}

/**
 * Initializes the div resizer by generating the necessary HTML elements
 * and attaching event listeners for resizing the window.
 */
function initDivResizer() {
  const buf = [];
  for (const ws of windowSizes) {
    buf.push(`
    <div class="resolution-div" data-width="${ws.width}" data-height="${ws.height}">
        <div class="resolution">${ws.width} × ${ws.height}</div>
        <div class="label">${ws.label}</div>
    </div>
    `);
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

    initDivResizer();
    initDivCleaner();

  } catch (_e) {
    divPalette.innerHTML = `<span class="ge-error-color">Error! This page cannot be scripted.</span>`;
  }
}

// Go:
go();


