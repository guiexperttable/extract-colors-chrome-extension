async function scrapColors() {
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});

  return chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: getColors

  }).then((res) => {
    return res[0].result;
  });
}


const getColors = () => {


  const elements = ['p','div','a','button','input','span','h1','h2','h3','li','ul','td'];

  /**
   * Converts a component to its hexadecimal representation.
   *
   * @param {number} c - The component value to convert.
   * @return {string} - The hexadecimal representation of the component.
   */
  function componentToHex(c) {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }

  /**
   * Retrieves the red, green, and blue components from a hexadecimal color code.
   *
   * @param {string} hex - The hexadecimal color code.
   * @returns {Array} An array containing the red, green, and blue components of the color.
   */
  function getRgbComponentsFromHex(hex) {
    hex = hex.replace(/#/g, '');
    return [hex.substr(0, 2), hex.substr(2, 2), hex.substr(4, 2)];
  }

  /**
   * Extracts the RGB components from the given RGB color string.
   *
   * @param {string} rgb - The RGB color string in the format "rgb(r, g, b)" or "rgba(r, g, b)".
   * @return {Array<string>} - The array containing the RGB components [r, g, b].
   */
  function getRgbComponentsFromRgb(rgb) {
    rgb = rgb.replace(/rgba?\(/, '').replace(')', '');
    return rgb.split(', ');
  }

  /**
   * Converts an RGB color (string) value to a hexadecimal representation.
   *
   * @param {string} rgb - The RGB color value to convert. It should be in the format "rgb(r, g, b)".
   * @returns {string} The hexadecimal representation of the given RGB color.
   */
  function rgbToHex(rgb) {
    const rgbArr = getRgbComponentsFromRgb(rgb);
    return '#' + componentToHex(parseInt(rgbArr[0])) + componentToHex(parseInt(rgbArr[1])) + componentToHex(parseInt(rgbArr[2]));
  }


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




  /**
   * Extracts extra colors from given elements.
   *
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

  /**
   * Calculates the sum of the weighted RGB components of a given hexadecimal color.
   *
   * @param {string} hex - The hexadecimal color code.
   * @return {number} - The sum of the weighted RGB components.
   */
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

  /**
   * Determines whether two objects are equal based on their element, visibility, and color.
   *
   * @param {object} o1 - The first object to compare.
   * @param {object} o2 - The second object to compare.
   * @returns {boolean} - True if the objects are equal, false otherwise.
   */
  function isEqual(o1, o2) {
    return o1.element === o2.element
      && o1.visible === o2.visible
      && o1.color.rgba === o2.color.rgba;
  }

  /**
   * Checks if an object is present in an array using a custom comparator function.
   *
   * @param {Array} arr - The array to search.
   * @param {Object} obj - The object to check for presence.
   * @param {Function} comparator - The custom comparator function to use for comparison.
   * @return {boolean} - True if the object is found in the array, false otherwise.
   */
  function arrayContainsObject(arr, obj, comparator) {
    return arr.some(item => comparator(item, obj));
  }

  
  return {
    extractedColors: extractColors().sort((a, b) => (a.bgColor.sum > b.bgColor.sum) ? 1 : -1)
  };
};
