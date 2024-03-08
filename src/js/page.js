const CAPTURE_DELAY = 150;
const TIMEOUT = 2000;
const CAPTURE_MSG_KEY = 'capture';

function onMessage(data, sender, callback) {
  if (data.msg === 'scrollPage') {
    getPositions(callback);
    return true;
  }
  console.error('Unknown message: ' + data.msg);
  return false;
}


function getMaxNonEmpty(nums) {
  return Math.max(...nums.filter(Boolean));
}


function getDimensions(dimension) {
  const body = document.body;
  return [
    document.documentElement['client' + dimension],
    body ? body['scroll' + dimension] : 0,
    document.documentElement['scroll' + dimension],
    body ? body['offset' + dimension] : 0,
    document.documentElement['offset' + dimension]
  ];
}


function getPositions(callback) {

  const body = document.body;
  const originalBodyOverflowYStyle = body ? body.style.overflowY : '';
  const originalX = window.scrollX;
  const originalY = window.scrollY;
  const originalOverflowStyle = document.documentElement.style.overflow;

  if (body) {
    body.style.overflowY = 'visible';
  }

  const widths = getDimensions('Width');
  const heights = getDimensions('Height');

  let totalWidth = getMaxNonEmpty(widths);
  const totalHeight = getMaxNonEmpty(heights);
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const arrangements = [];

  const scrollPad = 200;
  const dy = windowHeight - (windowHeight > scrollPad ? scrollPad : 0);
  const dx = windowWidth;

  let y = totalHeight - windowHeight;
  let x;
  let numArrangements;

  if (totalWidth <= dx + 1) {
    totalWidth = dx;
  }

  document.documentElement.style.overflow = 'hidden';

  while (y > -dy) {
    x = 0;
    while (x < totalWidth) {
      arrangements.push([x, y]);
      x += dx;
    }
    y -= dy;
  }


  numArrangements = arrangements.length;

  function cleanUp() {
    document.documentElement.style.overflow = originalOverflowStyle;
    if (body) {
      body.style.overflowY = originalBodyOverflowYStyle;
    }
    window.scrollTo(originalX, originalY);
  }

  (function processArrangements() {
    if (!arrangements.length) {
      cleanUp();
      if (callback) {
        callback();
      }
      return;
    }

    const next = arrangements.shift();
    const x = next[0];
    const y = next[1];

    window.scrollTo(x, y);


    const data = {
      msg: CAPTURE_MSG_KEY,
      x: window.scrollX,
      y: window.scrollY,
      complete: (numArrangements - arrangements.length) / numArrangements,
      windowWidth,
      totalWidth,
      totalHeight,
      devicePixelRatio: window.devicePixelRatio
    };

    window.setTimeout(() => {
      const cleanUpTimeout = window.setTimeout(cleanUp, TIMEOUT);
      chrome.runtime.sendMessage(data, captured => {
        window.clearTimeout(cleanUpTimeout);
        if (captured) {
          processArrangements();
        } else {
          cleanUp();
        }
      });

    }, CAPTURE_DELAY);
  })();
}


// init:
if (!window.hasScreenCapturePage) {
  window.hasScreenCapturePage = true;
  chrome.runtime.onMessage.addListener(onMessage);
}