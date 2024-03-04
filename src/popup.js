const btnOk = document.querySelector(".go-btn");
const btnToggleTheme = document.querySelector(".toggle-theme-btn");
const btnCopyImage = document.querySelector(".copy-img-btn");
const btnCopyValues = document.querySelector(".copy-values-btn");
const btnCopyHtml = document.querySelector(".copy-html-btn");
const checkboxToggleVisible = document.querySelector(".visible-only-input");
const divText = document.querySelector(".text-div");
const downLoadImgLink = document.querySelector(".download-img-a");



let data = {
  currentTheme: 'dark',
  visibleOnly: true
};

let grabbedData = {};
let currentColors = [];


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

function createColorImageCanvas(colors) {
  const canvas = document.createElement('canvas');

  const color_boxes_per_row = 4;

  const color_box_width = 140;
  const color_box_height = 100;
  const color_box_padding = 20;
  const color_rows = Math.ceil(colors.length / color_boxes_per_row);

  const img_width = ((color_box_width + (color_box_padding * 2)) * color_boxes_per_row) + (color_box_padding * 2);
  const img_height = ((color_box_height + (color_box_padding * 2) + 60) * color_rows) + (color_box_padding * 2);

  canvas.height = img_height;
  canvas.width = img_width;

  const img = canvas.getContext('2d');

  if (img) {
    const imageData = img.createImageData(img_width, img_height);

    img.putImageData(imageData, 0, 0);

    img.fillStyle = 'white';
    img.fillRect(0, 0, img_width, img_height);

    img.font = '14px Quicksand';

    let colorCounter = 0;
    for (let r = 0; r < color_rows; r++) {

      const co_y = color_box_padding * 2 + ((((color_box_padding * 2) + color_box_height) + 60) * r);

      for (let c = 0; c < color_boxes_per_row; c++) {
        if (colorCounter === colors.length) {
          break;
        } else {
          const co_x = color_box_padding * 2 + (((color_box_padding * 2) + color_box_width) * c);

          img.shadowBlur = 3;
          img.shadowColor = 'rgba(0,0,0,0.3)';
          const color = colors[colorCounter];
          img.fillStyle = color.rgba;
          img.fillRect(co_x, co_y, color_box_width, color_box_height);

          img.fillStyle = '#000';
          img.textAlign = 'center';
          img.fillText(color.hex, co_x + (color_box_width / 2), co_y + color_box_height + 20);
          img.fillText(color.rgba, co_x + (color_box_width / 2), co_y + color_box_height + 50);

          colorCounter++;
        }
      }
    }
  }

  return canvas;
}



const getUniqColors = (colors) => {
  const ret = [];
  for (const c of colors) {
    if (!arrayContainsObject(ret, c, isColorEqual)) {
      ret.push(c);
    }
  }
  return ret;
};

const renderColors = (colors) => {
  const buf = [''];
  colors.forEach(color => {
    buf.push(`
        <div>
          <div class="colored-div" style="background-color: ${color.rgba}"></div>
          <div class="color_box-text hex">${color.hex}</div>
          <div class="color_box-text rgb">${color.rgba}</div>
        </div>
      `);
  });
  buf.push(`</div>`);
  return buf.join('');
};

const grabColors = () => {
    divText.innerText = 'Analysing...';

    scrapColors().then(data => {
      grabbedData = data;
      divText.innerText = '';
      const colors = getUniqColors(
        data
          .extractedColors
          .filter(
            item => !data.visibleOnly || item.visible
          )
          .map(item=>item.bgColor)
          .concat(
            data.extractedColors
              .map(item=>item.color)
          )
      ).sort((a,b)=> a.sum - b.sum);

      currentColors = [...colors];
      document.querySelector('.content-div').innerHTML = renderColors(colors);
      downLoadImgLink.setAttribute('href', createColorImage(colors));
      // console.log(data);
    });
}


function updateHtmlDataThemeAttribute() {
  document.querySelector('html').setAttribute('data-theme', data.currentTheme);
}

function initListener() {
  btnOk.addEventListener("click", grabColors);

  btnToggleTheme.addEventListener("click", async () => {
    data.currentTheme = data.currentTheme === 'light' ? 'dark' : 'light';
    updateHtmlDataThemeAttribute();
    storeData();
  });

  btnCopyValues.addEventListener("click", async () => {
    const buf = [];
    for (const color of currentColors) {
      buf.push(`${color.rgba}`);
    }
    navigator.clipboard
      .writeText(buf.join('\n'))
      .then(() => divText.innerText = `Data copied do clipboard.`);
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
    console.log(html);
    navigator.clipboard
      .write([new ClipboardItem({
        'text/html': new Blob([html], {type: 'text/html'})
      })])
      .then(() => divText.innerText = `HTML copied do clipboard.`);
  });

  btnCopyImage.addEventListener("click", async () => {
    const canvas = createColorImageCanvas(currentColors);
    // Copy canvas to blob
    canvas.toBlob(blob => {
      // Create ClipboardItem with blob and it's type, and add to an array
      const data = [new ClipboardItem({[blob.type]: blob})];

      // Write the data to the clipboard
      navigator.clipboard
        .write(JSON.stringify(data, null, 0))
        .then(() => divText.innerText = `Image copied do clipboard.`);
    });
  });

  checkboxToggleVisible.addEventListener('change', function () {
    data.visibleOnly = this.checked;
    storeData();
    grabColors();
  });
}


// Go:
try {
  chrome.storage
    .sync
    .get()
    .then((result) => {
      if (result) {
        console.log(result)
        data = Object.assign(data, result);
        console.log('data', data)
      }
      updateHtmlDataThemeAttribute();
      checkboxToggleVisible.checked = data.visibleOnly;

      grabColors();
      initListener();
    });
} catch(_e) {
  grabColors();
  initListener();
}



