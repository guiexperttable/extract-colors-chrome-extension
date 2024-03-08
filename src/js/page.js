const CAPTURE_DELAY = 150;
const TIMEOUT = 2000;

function onMessage(data, sender, callback) {
  if (data.msg === 'scrollPage') {
    getPositions(callback);
    return true;
  }
  console.error('Unknown message received from background: ' + data.msg);
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

  let fullWidth = getMaxNonEmpty(widths);
  const fullHeight = getMaxNonEmpty(heights);
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const arrangements = [];

  const scrollPad = 200;
  const yDelta = windowHeight - (windowHeight > scrollPad ? scrollPad : 0);
  const xDelta = windowWidth;

  let yPos = fullHeight - windowHeight;
  let xPos;
  let numArrangements;

  if (fullWidth <= xDelta + 1) {
    fullWidth = xDelta;
  }

  document.documentElement.style.overflow = 'hidden';

  while (yPos > -yDelta) {
    xPos = 0;
    while (xPos < fullWidth) {
      arrangements.push([xPos, yPos]);
      xPos += xDelta;
    }
    yPos -= yDelta;
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

    const next = arrangements.shift(),
      x = next[0], y = next[1];

    window.scrollTo(x, y);

    const data = {
      msg: 'capture',
      x: window.scrollX,
      y: window.scrollY,
      complete: (numArrangements - arrangements.length) / numArrangements,
      windowWidth: windowWidth,
      totalWidth: fullWidth,
      totalHeight: fullHeight,
      devicePixelRatio: window.devicePixelRatio
    };

    // console.log('>> DATA', JSON.stringify(data, null, 4));

    // Need to wait for things to settle
    window.setTimeout(function () {
      // In case the below callback never returns, cleanup
      const cleanUpTimeout = window.setTimeout(cleanUp, TIMEOUT);

      chrome.runtime.sendMessage(data, function (captured) {
        window.clearTimeout(cleanUpTimeout);

        if (captured) {
          // Move on to capture next arrangement.
          processArrangements();
        } else {
          // If there's an error in popup.js, the response value can be
          // undefined, so cleanup
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