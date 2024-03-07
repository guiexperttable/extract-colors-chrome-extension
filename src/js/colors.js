



/**
 * Scrapes the colors from the currently active tab using Chrome extension APIs.
 *
 * @returns {Promise<Array>} - A promise that resolves to an array of colors scraped from the tab.
 */
async function scrapColors() {
  try {
    let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    return chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: getColors

    }).then((res) => {
      return res[0].result;
    });
  } catch (err) {
    console.error(`failed to execute script: ${err}`);
  }
}


/**
 * Retrieves all CSS custom properties that have color values from the loaded style sheets.
 *
 * @returns {Array<Object>} An array of objects containing the rule selector, property name, and property value.
 */
const getColors = () => {


  /**
   * Represents an array of HTML elements.
   * @type {Array<string>}
   */
  const elements = ['html', 'body', 'p','div','a','button','input','span','h1','h2','h3','li','ul','table','th','tr','td'];

  /**
   * Regular expression for validating color values.
   *
   * The colorRegex variable represents a regular expression that matches various color formats,
   * including hexadecimal colors (#RRGGBB or #RGB), RGB, HSL, HWB, LAB, LCH, Oklab, Oklch color models,
   * and their respective alpha channel variants (e.g., rgba(), hsla(), etc.).
   *
   * @type {RegExp}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value}
   */
  const colorRegex = /^(#([0-9a-fA-F]{3}){1,2}|(rgb|hsl|hwb|lab|lch|oklab|oklch)a?\((-?\d+%?,\s*){2,3}-?\d*%?\))$/;

  /**
   * An array containing keywords for various colors.
   *
   * @type {string[]}
   */
  const colorKeywords = ["aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque", "black", "blanchedalmond", "blue", "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson", "cyan", "darkblue", "darkcyan", "darkgoldenrod", "darkgray", "darkgreen", "darkgrey", "darkkhaki", "darkmagenta", "darkolivegreen", "darkorange", "darkorchid", "darkred", "darksalmon", "darkseagreen", "darkslateblue", "darkslategray", "darkslategrey", "darkturquoise", "darkviolet", "deeppink", "deepskyblue", "dimgray", "dimgrey", "dodgerblue", "firebrick", "floralwhite", "forestgreen", "fuchsia", "gainsboro", "ghostwhite", "gold", "goldenrod", "gray", "green", "greenyellow", "grey", "honeydew", "hotpink", "indianred", "indigo", "ivory", "khaki", "lavender", "lavenderblush", "lawngreen", "lemonchiffon", "lightblue", "lightcoral", "lightcyan", "lightgoldenrodyellow", "lightgray", "lightgreen", "lightgrey", "lightpink", "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray", "lightslategrey", "lightsteelblue", "lightyellow", "lime", "limegreen", "linen", "magenta", "maroon", "mediumaquamarine", "mediumblue", "mediumorchid", "mediumpurple", "mediumseagreen", "mediumslateblue", "mediumspringgreen", "mediumturquoise", "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin", "navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange", "orangered", "orchid", "palegoldenrod", "palegreen", "paleturquoise", "palevioletred", "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue", "purple", "rebeccapurple", "red", "rosybrown", "royalblue", "saddlebrown", "salmon", "sandybrown", "seagreen", "seashell", "sienna", "silver", "skyblue", "slateblue", "slategray", "slategrey", "snow", "springgreen", "steelblue", "tan", "teal", "thistle", "tomato", "turquoise", "violet", "wheat", "white", "whitesmoke", "yellow", "yellowgreen"];

  /**
   * Array of CSS color method names.
   *
   * @type {Array<string>}
   */
  const cssColorMethods = [
    "color-adjust",
    "color-contrast",
    "color-gamut",
    "color-grayscale",
    "color-invert",
    "color-mix",
    "color-profile",
    "color-rendering",
    "color-saturation",
    "color-scheme",
    "color-stop",
    "color-temperature",
    "color",
    "color-interpolation"
  ];


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
        const colorRgba = style.color;
        const colorHex = rgbToHex(colorRgba);
        const bgColorRgba = style.backgroundColor;
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
      && o1.color.rgba === o2.color.rgba
      && o1.bgColor.rgba === o2.bgColor.rgba;
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




  /**
   * Checks if the given value is a valid css color.
   *
   * @param {string} value - The value to be checked.
   * @return {boolean} - True if the value is a valid color, false otherwise.
   */
  function isColor(value) {
    if (cssColorMethods.includes(value)) return true;
    if (colorKeywords.includes(value)) return true;
    return colorRegex.test(value.trim());
  }

  /**
   * Retrieves all CSS custom properties that have color values from the loaded style sheets.
   *
   * @returns {Array<Object>} An array of objects containing the rule selector, property name, and property value.
   */
  function getCSSCustomProperties() {
    const ret = [];
    for (const styleSheet of document.styleSheets) {
      if (styleSheet.href && styleSheet.href.startsWith(window.location.origin)) {
        for (const rule of styleSheet.cssRules) {
          if (rule instanceof CSSStyleRule) {
            const style = rule.style;
            for (let i = 0; i < style.length; i++) {
              const propertyName = style[i];
              if (propertyName.startsWith('--')) {
                let propertyValue = style.getPropertyValue(propertyName);
                if (isColor(propertyValue)) {
                  ret.push({
                    rule: rule.selectorText,
                    propertyName,
                    propertyValue
                  });
                }
              }
            }
          }
        }
      }
    }
    return ret;
  }

  /**
   * Retrieves all CSS custom properties as a nested map.
   *
   * @returns {Object} - Nested map of CSS custom properties.
   */
  function getCSSCustomPropertiesAsMap() {
    const properties = getCSSCustomProperties();
    const map = {};
    properties.forEach(property => {
      const { propertyName, propertyValue, rule } = property;
      if (!map[rule]) {
        map[rule] = {};
      }
      map[rule][propertyName] = propertyValue;
    });
    return map;
  }

  
  const ret = {
    cssCustomProperties: getCSSCustomPropertiesAsMap(),
    extractedColors: extractColors().sort((a, b) => (a.bgColor.sum > b.bgColor.sum) ? 1 : -1)
  };
  if (window.location.href.includes('debug=1')) {
    console.log(ret);
  }
  return ret;
};
