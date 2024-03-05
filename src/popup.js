const btnOk = document.querySelector(".go-btn");
const btnToggleTheme = document.querySelector(".toggle-theme-btn");
const btnCopyImage = document.querySelector(".copy-img-btn");
const btnCopyValues = document.querySelector(".copy-values-btn");
const btnCopyHtml = document.querySelector(".copy-html-btn");
const btnEyeDropper = document.querySelector(".eyedropper-btn");
const checkboxToggleVisible = document.querySelector(".visible-only-input");
const divText = document.querySelector(".text-div");
const divContent = document.querySelector(".content-div");
const downLoadImgLink = document.querySelector(".download-img-a");


let data = {
  currentTheme: 'dark',
  visibleOnly: true
};

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

  window.devicePixelRatio=2;
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
    setTimeout(()=>{
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
        <div>
          <div class="colored-div" data-color="${color.rgba}" style="background-color: ${color.rgba}"></div>
          <div class="color_box-text hex">${color.hex}</div>
          <div class="color_box-text rgb">${color.rgba}</div>
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
    divContent.innerHTML = renderColors(colors);
    divContent
      .querySelectorAll('div[data-color]')
      .forEach(ele=>
        ele.addEventListener('click', ()=> copyColor(ele))
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
 * Returns an SVG string representing a dark mode icon.
 *
 * @returns {string} The SVG string.
 */
function getSvgDarkMode() {
  return `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Zm0-80q88 0 158-48.5T740-375q-20 5-40 8t-40 3q-123 0-209.5-86.5T364-660q0-20 3-40t8-40q-78 32-126.5 102T200-480q0 116 82 198t198 82Zm-10-270Z"/></svg>`;
}

/**
 * Retrieves the SVG representation of the light mode.
 *
 * @returns {string} The SVG representation of the light mode.
 */
function getSvgLightMode() {
  return `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z"/></svg>`;
}


/**
 * Updates the HTML attribute 'data-theme' based on the current theme and toggles the icon on a button element.
 *
 * @return {undefined}
 */
function updateHtmlDataThemeAttributeAndToggleIcon() {
  if (data.currentTheme === 'dark') {
    btnToggleTheme.innerHTML = getSvgDarkMode();
  } else {
    btnToggleTheme.innerHTML = getSvgLightMode();
  }
  document.querySelector('html').setAttribute('data-theme', data.currentTheme);
}

/**
 * Attaches event listeners to various buttons and checkboxes.
 * @return {void}
 */
function initListener() {
  btnOk.addEventListener("click", grabColors);

  btnToggleTheme.addEventListener("click", async () => {
    data.currentTheme = data.currentTheme === 'light' ? 'dark' : 'light';
    updateHtmlDataThemeAttributeAndToggleIcon();
    storeData();
  });

  btnCopyValues.addEventListener("click", async () => {
    const buf = [];
    for (const color of currentColors) {
      buf.push(`${color.rgba}`);
    }
    navigator.clipboard
      .writeText(buf.join('\n'))
      .then(() => setLabelText(`Data copied to clipboard.`));
  });

  btnCopyHtml.addEventListener("click", async () => {
    const box = document.querySelector('.content-div').innerHTML;
    const html = `
  <html lang="en" data-theme="light">
    <style>
      html, body {
          width: 600px;
      }
      .content-div {
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
      <div class="content-div">
        ${box}
      </div>   
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

  checkboxToggleVisible.addEventListener('change', function () {
    data.visibleOnly = this.checked;
    storeData();
    grabColors();
  });


  btnEyeDropper.addEventListener("click", async () => {
    divContent.classList.add('hidden');
    const eyeDropper = new EyeDropper();
    eyeDropper
      .open()
      .then((result) => {
        divContent.classList.remove(['hidden']);
        const color = result.sRGBHex;
        navigator.clipboard
          .writeText(color)
          .then(() => setLabelText(`${color} copied to clipboard.`));
      })
      .catch((e) => {
        //
      });
  });
}


/**
 * Executes the main logic of the application.
 * Retrieves the data from chrome storage and updates the UI accordingly.
 * Initializes the event listener and color grabbing functionality.
 *
 * @return {void}
 */
function go() {
  try {
    chrome.storage
      .sync
      .get()
      .then((result) => {
        if (result) {
          data = Object.assign(data, result);
        }
        updateHtmlDataThemeAttributeAndToggleIcon();
        checkboxToggleVisible.checked = data.visibleOnly;

        grabColors();
        initListener();
      });
  } catch (_e) {
    grabColors();
    initListener();
  }
}

// Go:
go();


