const btnOk = document.querySelector(".go-btn");
const btnToggleTheme = document.querySelector(".toggle-theme-btn");
const btnCopyImage = document.querySelector(".copy-img-btn");
const checkboxToggleVisible = document.querySelector(".visible-only-input");
const divText = document.querySelector(".text-div");
const downLoadImgLink = document.querySelector(".download-img-a");


let currentTheme = 'dark';
let visibleOnly = true;

function arrayContainsObject(arr, obj, comparator) {
  return arr.some(item => comparator(item, obj));
}

function isColorEqual(o1, o2) {
  return o1.sum === o2.sum;
}

function isColorEqualStrict(o1, o2) {
  return o1.rgba === o2.rgba;
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

  return canvas.toDataURL('image/jpg');
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
        <div class="color_box all active">
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
      divText.innerText = '';
      const colors = getUniqColors(
        data
          .extractedColors
          .filter(
            item => !visibleOnly || item.visible
          )
          .map(item=>item.bgColor)
          .concat(
            data.extractedColors
              .map(item=>item.color)
          )
      ).sort((a,b)=> a.sum - b.sum);
      document.querySelector('.content-div').innerHTML = renderColors(colors);
      downLoadImgLink.setAttribute('href', createColorImage(colors));

      console.log(data);
      console.log('colors', colors);
      console.log(data.extractedColors.map(item=>item.bgColor).concat(data.extractedColors.map(item=>item.color)));
    });
}

btnOk.addEventListener("click", grabColors);

btnToggleTheme.addEventListener("click", async () => {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.querySelector('html').setAttribute('data-theme', currentTheme);
});

checkboxToggleVisible.addEventListener('change', function() {
  visibleOnly = this.checked;
  grabColors();
});


// Go:
// btnOk.click();
grabColors();



//     navigator.clipboard.writeText(csv).then(() => alert(`Data copied do clipboard.`))