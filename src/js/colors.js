async function scrapColors() {
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});

  return chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: getColors,
    // args: [document]
  }).then((res) => {
    return res[0].result;
  });
}


const getColors = () => {

  const elements = ['p','div','a','button','input','span','h1','h2','h3','li','ul','td'];

  function componentToHex(c) {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }

  function getRgbComponentsFromHex(hex) {
    hex = hex.replace(/#/g, '');
    return [hex.substr(0, 2), hex.substr(2, 2), hex.substr(4, 2)];
  }

  function getRgbComponentsFromRgb(rgb) {
    rgb = rgb.replace(/rgba?\(/, '').replace(')', '');
    return rgb.split(', ');
  }

  function rgbToHex(rgb) {
    const rgbArr = getRgbComponentsFromRgb(rgb);
    return '#' + componentToHex(parseInt(rgbArr[0])) + componentToHex(parseInt(rgbArr[1])) + componentToHex(parseInt(rgbArr[2]));
  }

  // function hexToRgb(hex) {
  //   const [r, g, b] = getRgbComponentsFromHex(hex);
  //   return `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)})`;
  // }

  // function sortHex(hexArray) {
  //   const orderedHex = hexArray.map(hex => {
  //     const [r, g, b] = getRgbComponentsFromHex(hex);
  //     const sum = (0.3 * parseInt(r, 16) / 255) + (0.59 * parseInt(g, 16) / 255) + (0.11 * parseInt(b, 16) / 255);
  //     return {
  //       'hex': '#' + hex,
  //       'sum': sum,
  //     };
  //   });
  //   orderedHex.sort((a, b) => (a.sum > b.sum) ? 1 : -1);
  //   return orderedHex.map(a => a.hex);
  // }

  // function extractColorsFromElement(element) {
  //   const visible = [];
  //   const hidden = [];
  //   document.querySelectorAll(element).forEach(el => {
  //     const style = getComputedStyle(el);
  //     const bgColor = rgbToHex(style.backgroundColor);
  //     const color = rgbToHex(style.color);
  //
  //     if (isVisible(el)) {
  //       visible.push(bgColor, color);
  //     } else {
  //       hidden.push(bgColor, color);
  //     }
  //   });
  //   return [visible, hidden];
  // }


  /**
   * Checks if the specified element and its ancestors are visible.
   * An element is considered visible if its CSS display property is not 'none' or 'hidden',
   * and its visibility CSS property is not 'hidden'.
   *
   * @param {Element} el - The element to check visibility for.
   * @returns {boolean} - True if the element and its ancestors are visible, false otherwise.
   */
  function isVisible(el) {
    if (['none', 'hidden'].includes(getComputedStyle(el).display) || getComputedStyle(el).visibility === 'hidden') {
      return false;
    }
    let parent = el.parentElement;
    while (parent !== null) {
      if (['none', 'hidden'].includes(getComputedStyle(parent).display) || getComputedStyle(parent).visibility === 'hidden') {
        return false;
      }
      parent = parent.parentElement;
    }
    return true;
  }

  // function unique(arr) {
  //   return [...new Set(arr)];
  // }

  /*
  function  createColorImage(colors) {
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
            img.fillStyle = colors[colorCounter];
            img.fillRect(co_x, co_y, color_box_width, color_box_height);

            img.fillStyle = '#000';
            img.textAlign = 'center';
            img.fillText(hexToRgb(colors[colorCounter]), co_x + (color_box_width / 2), co_y + color_box_height + 20);
            img.fillText(colors[colorCounter], co_x + (color_box_width / 2), co_y + color_box_height + 50);

            colorCounter++;
          }
        }
      }
    }

    return canvas.toDataURL('image/jpg');
  }

   */



  /**
   * Extracts extra colors from given elements.
   *
   * @param {Array} elements - The elements to extract colors from.
   * @return {Array} - The extra colors extracted from the given elements.
   *
   *     [
   *       {
   *         element: 'p' | 'div', ...
   *         visible: true | false,
   *         bgColor: {
   *           hex: '#0098db',
   *           rgba: '#0098db',
   *           sum: 56789 // for sorting
   *         },
   *         color: {
   *           hex: '#0098db',
   *           rgba: '#0098db',
   *           sum: 678
   *         }
   *       },
   *       ...
   *     ]
   *
   */
  function extractColors(){
    const ret = [];
    for (const ele of elements) {
      extractColorsFromGivenElement(ele, ret);
    }
    return ret;
  }

  function rgbaSum(hex){
    const [r, g, b] = getRgbComponentsFromHex(hex);
    return (0.3 * parseInt(r, 16) / 255) + (0.59 * parseInt(g, 16) / 255) + (0.11 * parseInt(b, 16) / 255);
  }

  /**
   * Extracts colors and visibility from elements matching the given selector.
   *
   * @param {string} element - The CSS selector for the elements to extract colors from.
   * @param {Array} ret - The array to store the extracted colors and visibility.
   * @returns {Array} - The modified ret array containing the extracted colors and visibility.
   */
  function extractColorsFromGivenElement(element, ret) {
    document
      .querySelectorAll(element)
      .forEach(el => {
        const style = getComputedStyle(el);
        const colorRgba = style.backgroundColor;
        const colorHex = rgbToHex(colorRgba);
        const bgColorRgba = style.color;
        const bgColorHex = rgbToHex(bgColorRgba);
        const visible = isVisible(el);

        const item = {
          element: element+'',
          visible: visible,
          color: {
            hex: colorHex,
            rgba: colorRgba,
            sum: rgbaSum(colorHex)
          },
          bgColor: {
            hex: bgColorHex,
            rgba: bgColorRgba,
            sum: rgbaSum(bgColorHex)
          }
        };
        if (!arrayContainsObject(ret, item, isEqual)) {
          ret.push(item);
        }
    });
    return ret;
  }

  function isEqual(o1, o2) {
    return o1.element === o2.element
      && o1.visible === o2.visible
      && o1.color.rgba === o2.color.rgba;
  }

  function arrayContainsObject(arr, obj, comparator) {
    return arr.some(item => comparator(item, obj));
  }

  function getResult() {
    return {
      extractedColors: extractColors().sort((a, b) => (a.bgColor.sum > b.bgColor.sum) ? 1 : -1)
    };
  }
  
  return getResult();
};
