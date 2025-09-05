
https://github.com/guiexperttable/extract-colors-chrome-extension/issues/1

```

function rgbaToHslaString(r: number, g: number, b: number, a: number): string {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  const H = Math.round(h * 360);
  const S = Math.round(s * 100);
  const L = Math.round(l * 100);
  const A = parseFloat(a.toFixed(2));

  return `hsla(${H}, ${S}%, ${L}%, ${A})`;
}

// Beispiel:
console.log(rgbaToHslaString(255, 0, 0, 0.5)); // "hsla(0, 100%, 50%, 0.5)"


```