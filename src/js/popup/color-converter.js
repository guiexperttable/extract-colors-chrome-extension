/**
 * Converts RGB or RGBA string to number array.
 *
 * @param {string} rgbString - The RGB or RGBA string to be converted.
 * @returns {number[]} - The converted number array.
 * @throws {Error} - If the RGB or RGBA format is invalid.
 */
const rgbStringToNumberArray = (rgbString) => {
  const rgbaRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(\.\d+)?))?\)/;
  const matches = rgbString.match(rgbaRegex);
  if (!matches) {
    throw new Error('Wrong RGB or RGBA format!');
  }

  const [, r, g, b, a] = matches.map(Number); // ignore first match

  if (!isNaN(a)) {
    return [r, g, b, a];
  } else {
    return [r, g, b];
  }
};


/**
 * Convert RGB color values to OKLCH color space.
 *
 * @param {number} r - The red color channel value (0-255).
 * @param {number} g - The green color channel value (0-255).
 * @param {number} b - The blue color channel value (0-255).
 * @param {number} alpha - The alpha/opacity value (0-1).
 * @return {Array} The OKLCH color values [L, C, H, alpha].
 */
export function rgb2oklch(r, g, b, alpha) {
  const [l, a, b_, _alpha] = rgb2oklab(r, g, b, alpha);
  return lab2lch(l, a, b_, _alpha);
}

/**
 * Converts OKLCH color values to a string representation.
 * @param {number} l - The lightness value (0-1).
 * @param {number} c - The chroma value (0-1).
 * @param {number} h - The hue value (0-1).
 * @param {number} [alpha] - The alpha value (0-1).
 * @returns {string} - The string representation of the OKLCH color values.
 */
export function oklchToString(l, c, h, alpha) {
  const f = (n, d) => n.toFixed(d)
    .replace(/\.000/g, '')
    .replace(/\.00/g, '');
  let per = (n) => (n * 100).toFixed(2).replace(/\.00/g, '');

  let ls = per(l);
  let cs = f(c, 3);
  if (cs.includes('.')) {
    cs = cs.replace(/0$/g, '');
  }
  let hs = f(h, 2);
  if (alpha !== undefined) {
    return `oklch(${ls}% ${cs} ${hs} / ${per(alpha)}%)`;
  }
  return `oklch(${ls}% ${cs} ${hs})`;
}


/**
 * Converts RGB color values to OKLab color space.
 *
 * @param {number} r - The red component value, ranging from 0 to 255.
 * @param {number} g - The green component value, ranging from 0 to 255.
 * @param {number} b - The blue component value, ranging from 0 to 255.
 * @param {number} [alpha] - The alpha component value, ranging from 0 to 1. Optional.
 *
 * @return {Array} An array containing OKLab color values.
 *                  - The first element is the lightness value.
 *                  - The second element is the chroma value.
 *                  - The third element is the hue value.
 *                  - The fourth element (optional) is the alpha value.
 *
 * @see {@link https://bottosson.github.io/posts/oklab/} for more information on OKLab color space.
 */
function rgb2oklab(r, g, b, alpha) {
  const {cbrt} = Math;
  // OKLab color space implementation taken from https://bottosson.github.io/posts/oklab/
  const [lr, lg, lb] = [rgb2lrgb(r / 255), rgb2lrgb(g / 255), rgb2lrgb(b / 255)];
  const l = cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  let hue = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  if (isNaN(hue)) {
    hue = 0;
  }
  let lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  let chroma = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  if (alpha !== undefined) {
    return [
      lightness,
      chroma,
      hue,
      alpha
    ];
  }
  return [
    lightness,
    chroma,
    hue
  ];
}

/**
 * Convert LAB color to LCH color.
 *
 * @param {number} l - The L value of the LAB color.
 * @param {number} a - The A value of the LAB color.
 * @param {number} b - The B value of the LAB color.
 * @param {number} alpha - [Optional] The alpha value of the color.
 * @return {number[]} The LCH color representation [L, C, H, ?
 */
function lab2lch(l, a, b, alpha) {
  const {sqrt, atan2, round} = Math;
  const c = sqrt(a * a + b * b);
  const PI = Math.PI;
  const RAD2DEG = 180 / PI;
  let h = (atan2(b, a) * RAD2DEG + 360) % 360;
  if (round(c * 10000) === 0) h = 0;
  if (alpha !== undefined) {
    return [l, c, h, alpha];
  }
  return [l, c, h];
}

/**
 * Converts an RGB color value to linear RGB color value.
 *
 * @param {number} c - The RGB color value to be converted.
 * @returns {number} - The linear RGB color value.
 */
function rgb2lrgb(c) {
  const {abs, pow, sign} = Math;
  if (abs(c) < 0.04045) {
    return c / 12.92;
  }
  return (sign(c) || 1) * pow((abs(c) + 0.055) / 1.055, 2.4);
}


const hexTailwind = {
  "#f44336": "red-500",
  "#ffebee": "red-50",
  "#ffcdd2": "red-100",
  "#ef9a9a": "red-200",
  "#e57373": "red-300",
  "#ef5350": "red-400",
  "#e53935": "red-600",
  "#d32f2f": "red-700",
  "#c62828": "red-800",
  "#b71c1c": "red-900",
  "#ff8a80": "red-100-accent",
  "#ff5252": "red-200-accent",
  "#ff1744": "red-400-accent",
  "#d50000": "red-700-accent",
  "#e91e63": "pink-500",
  "#fce4ec": "pink-50",
  "#f8bbd0": "pink-100",
  "#f48fb1": "pink-200",
  "#f06292": "pink-300",
  "#ec407a": "pink-400",
  "#d81b60": "pink-600",
  "#c2185b": "pink-700",
  "#ad1457": "pink-800",
  "#880e4f": "pink-900",
  "#ff80ab": "pink-100-accent",
  "#ff4081": "pink-200-accent",
  "#f50057": "pink-400-accent",
  "#c51162": "pink-700-accent",
  "#9c27b0": "purple-500",
  "#f3e5f5": "purple-50",
  "#e1bee7": "purple-100",
  "#ce93d8": "purple-200",
  "#ba68c8": "purple-300",
  "#ab47bc": "purple-400",
  "#8e24aa": "purple-600",
  "#7b1fa2": "purple-700",
  "#6a1b9a": "purple-800",
  "#4a148c": "purple-900",
  "#ea80fc": "purple-100-accent",
  "#e040fb": "purple-200-accent",
  "#d500f9": "purple-400-accent",
  "#aa00ff": "purple-700-accent",
  "#673ab7": "deep-purple-500",
  "#ede7f6": "deep-purple-50",
  "#d1c4e9": "deep-purple-100",
  "#b39ddb": "deep-purple-200",
  "#9575cd": "deep-purple-300",
  "#7e57c2": "deep-purple-400",
  "#5e35b1": "deep-purple-600",
  "#512da8": "deep-purple-700",
  "#4527a0": "deep-purple-800",
  "#311b92": "deep-purple-900",
  "#b388ff": "deep-purple-100-accent",
  "#7c4dff": "deep-purple-200-accent",
  "#651fff": "deep-purple-400-accent",
  "#6200ea": "deep-purple-700-accent",
  "#3f51b5": "indigo-500",
  "#e8eaf6": "indigo-50",
  "#c5cae9": "indigo-100",
  "#9fa8da": "indigo-200",
  "#7986cb": "indigo-300",
  "#5c6bc0": "indigo-400",
  "#3949ab": "indigo-600",
  "#303f9f": "indigo-700",
  "#283593": "indigo-800",
  "#1a237e": "indigo-900",
  "#8c9eff": "indigo-100-accent",
  "#536dfe": "indigo-200-accent",
  "#3d5afe": "indigo-400-accent",
  "#304ffe": "indigo-700-accent",
  "#2196f3": "blue-500",
  "#e3f2fd": "blue-50",
  "#bbdefb": "blue-100",
  "#90caf9": "blue-200",
  "#64b5f6": "blue-300",
  "#42a5f5": "blue-400",
  "#1e88e5": "blue-600",
  "#1976d2": "blue-700",
  "#1565c0": "blue-800",
  "#0d47a1": "blue-900",
  "#82b1ff": "blue-100-accent",
  "#448aff": "blue-200-accent",
  "#2979ff": "blue-400-accent",
  "#2962ff": "blue-700-accent",
  "#03a9f4": "light-blue-500",
  "#e1f5fe": "light-blue-50",
  "#b3e5fc": "light-blue-100",
  "#81d4fa": "light-blue-200",
  "#4fc3f7": "light-blue-300",
  "#29b6f6": "light-blue-400",
  "#039be5": "light-blue-600",
  "#0288d1": "light-blue-700",
  "#0277bd": "light-blue-800",
  "#01579b": "light-blue-900",
  "#80d8ff": "light-blue-100-accent",
  "#40c4ff": "light-blue-200-accent",
  "#00b0ff": "light-blue-400-accent",
  "#0091ea": "light-blue-700-accent",
  "#00bcd4": "cyan-500",
  "#e0f7fa": "cyan-50",
  "#b2ebf2": "cyan-100",
  "#80deea": "cyan-200",
  "#4dd0e1": "cyan-300",
  "#26c6da": "cyan-400",
  "#00acc1": "cyan-600",
  "#0097a7": "cyan-700",
  "#00838f": "cyan-800",
  "#006064": "cyan-900",
  "#84ffff": "cyan-100-accent",
  "#18ffff": "cyan-200-accent",
  "#00e5ff": "cyan-400-accent",
  "#00b8d4": "cyan-700-accent",
  "#009688": "teal-500",
  "#e0f2f1": "teal-50",
  "#b2dfdb": "teal-100",
  "#80cbc4": "teal-200",
  "#4db6ac": "teal-300",
  "#26a69a": "teal-400",
  "#00897b": "teal-600",
  "#00796b": "teal-700",
  "#00695c": "teal-800",
  "#004d40": "teal-900",
  "#a7ffeb": "teal-100-accent",
  "#64ffda": "teal-200-accent",
  "#1de9b6": "teal-400-accent",
  "#00bfa5": "teal-700-accent",
  "#4caf50": "green-500",
  "#e8f5e9": "green-50",
  "#c8e6c9": "green-100",
  "#a5d6a7": "green-200",
  "#81c784": "green-300",
  "#66bb6a": "green-400",
  "#43a047": "green-600",
  "#388e3c": "green-700",
  "#2e7d32": "green-800",
  "#1b5e20": "green-900",
  "#b9f6ca": "green-100-accent",
  "#69f0ae": "green-200-accent",
  "#00e676": "green-400-accent",
  "#00c853": "green-700-accent",
  "#8bc34a": "light-green-500",
  "#f1f8e9": "light-green-50",
  "#dcedc8": "light-green-100",
  "#c5e1a5": "light-green-200",
  "#aed581": "light-green-300",
  "#9ccc65": "light-green-400",
  "#7cb342": "light-green-600",
  "#689f38": "light-green-700",
  "#558b2f": "light-green-800",
  "#33691e": "light-green-900",
  "#ccff90": "light-green-100-accent",
  "#b2ff59": "light-green-200-accent",
  "#76ff03": "light-green-400-accent",
  "#64dd17": "light-green-700-accent",
  "#cddc39": "lime-500",
  "#f9fbe7": "lime-50",
  "#f0f4c3": "lime-100",
  "#e6ee9c": "lime-200",
  "#dce775": "lime-300",
  "#d4e157": "lime-400",
  "#c0ca33": "lime-600",
  "#afb42b": "lime-700",
  "#9e9d24": "lime-800",
  "#827717": "lime-900",
  "#f4ff81": "lime-100-accent",
  "#eeff41": "lime-200-accent",
  "#c6ff00": "lime-400-accent",
  "#aeea00": "lime-700-accent",
  "#ffeb3b": "yellow-500",
  "#fffde7": "yellow-50",
  "#fff9c4": "yellow-100",
  "#fff59d": "yellow-200",
  "#fff176": "yellow-300",
  "#ffee58": "yellow-400",
  "#fdd835": "yellow-600",
  "#fbc02d": "yellow-700",
  "#f9a825": "yellow-800",
  "#f57f17": "yellow-900",
  "#ffff8d": "yellow-100-accent",
  "#ffff00": "yellow-200-accent",
  "#ffea00": "yellow-400-accent",
  "#ffd600": "yellow-700-accent",
  "#ffc107": "amber-500",
  "#fff8e1": "amber-50",
  "#ffecb3": "amber-100",
  "#ffe082": "amber-200",
  "#ffd54f": "amber-300",
  "#ffca28": "amber-400",
  "#ffb300": "amber-600",
  "#ffa000": "amber-700",
  "#ff8f00": "amber-800",
  "#ff6f00": "amber-900",
  "#ffe57f": "amber-100-accent",
  "#ffd740": "amber-200-accent",
  "#ffc400": "amber-400-accent",
  "#ffab00": "amber-700-accent",
  "#ff9800": "orange-500",
  "#fff3e0": "orange-50",
  "#ffe0b2": "orange-100",
  "#ffcc80": "orange-200",
  "#ffb74d": "orange-300",
  "#ffa726": "orange-400",
  "#fb8c00": "orange-600",
  "#f57c00": "orange-700",
  "#ef6c00": "orange-800",
  "#e65100": "orange-900",
  "#ffd180": "orange-100-accent",
  "#ffab40": "orange-200-accent",
  "#ff9100": "orange-400-accent",
  "#ff6d00": "orange-700-accent",
  "#ff5722": "deep-orange-500",
  "#fbe9e7": "deep-orange-50",
  "#ffccbc": "deep-orange-100",
  "#ffab91": "deep-orange-200",
  "#ff8a65": "deep-orange-300",
  "#ff7043": "deep-orange-400",
  "#f4511e": "deep-orange-600",
  "#e64a19": "deep-orange-700",
  "#d84315": "deep-orange-800",
  "#bf360c": "deep-orange-900",
  "#ff9e80": "deep-orange-100-accent",
  "#ff6e40": "deep-orange-200-accent",
  "#ff3d00": "deep-orange-400-accent",
  "#dd2c00": "deep-orange-700-accent",
  "#795548": "brown-500",
  "#efebe9": "brown-50",
  "#d7ccc8": "brown-100",
  "#bcaaa4": "brown-200",
  "#a1887f": "brown-300",
  "#8d6e63": "brown-400",
  "#6d4c41": "brown-600",
  "#5d4037": "brown-700",
  "#4e342e": "brown-800",
  "#3e2723": "brown-900",
  "#9e9e9e": "grey-500",
  "#fafafa": "grey-50",
  "#f5f5f5": "grey-100",
  "#eeeeee": "grey-200",
  "#e0e0e0": "grey-300",
  "#bdbdbd": "grey-400",
  "#757575": "grey-600",
  "#616161": "grey-700",
  "#424242": "grey-800",
  "#212121": "grey-900",
  "#607d8b": "blue-grey-500",
  "#eceff1": "blue-grey-50",
  "#cfd8dc": "blue-grey-100",
  "#b0bec5": "blue-grey-200",
  "#90a4ae": "blue-grey-300",
  "#78909c": "blue-grey-400",
  "#546e7a": "blue-grey-600",
  "#455a64": "blue-grey-700",
  "#37474f": "blue-grey-800",
  "#263238": "blue-grey-900"
};


/**
 * Converts a hex code to the corresponding Tailwind utility class.
 *
 * @param {string} hex - The hex code to convert.
 * @returns {string} - The Tailwind utility class corresponding to the hex code.
 */
export function hexToTailwind(hex) {
  return hexTailwind[hex];
}


function test() {
  const patterns = [
    {rgb: [100, 100, 100], out: 'oklch(50.32% 0 0)'},
    {rgb: [0, 0, 0], out: 'oklch(0% 0 0)'},
    {rgb: [255, 255, 255], out: 'oklch(100% 0 0)'},
    {rgb: [57, 48, 51], out: 'oklch(32% 0.014 355.81)'},
    {rgb: 'rgba(200, 100, 88, 0.5)', out: 'oklch(61.93% 0.13 28.41 / 50%)'},
    {rgb: 'rgba(0,0,0,0)', out: 'oklch(0% 0 0 / 0%)'},
  ];
  for (const t of patterns) {
    const rgb = t.rgb.length < 5 ? t.rgb : rgbStringToNumberArray(t.rgb);
    const oklch = rgb2oklch(...rgb);
    let out = oklchToString(...oklch);
    if (out !== t.out) {
      console.warn('rgb( ' + rgb + ') -> ', out + ' <=?=> ' + t.out);
    } else {
      console.log('rgb(' + rgb + ') -> ', out);
    }
  }
}

// test();
