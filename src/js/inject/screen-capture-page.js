
if (!window['screenCaptureLoaded']) {

  const SCREEN_CAPTURE_DELAY = 500;
  const MSG_TYPE_CAPTURE = 'capture';
  const MSG_TYPE_LOGGING = 'logging';
  const MSG_TYPE_SCROLLPAGE = 'scrollPage';

  const scrollYSource = window;
  let elementWithScrollToFn = document.documentElement;




  function scrollToXY(x, y) {
    window.scrollTo(x, y);
    elementWithScrollToFn.scrollTo(x, y);
  }



  function getScrollPosition(windowProperty, elementProperty) {
    if (window[windowProperty] > 0) {
      return window[windowProperty];
    }
    for (const ele of [elementWithScrollToFn, scrollYSource]) {
      if (elementProperty in ele) {
        const position = ele[elementProperty];
        if (position !== undefined && position !== null) {
          return position;
        }
      }
    }
    return scrollYSource[windowProperty];
  }


  function getScrollY() {
    return getScrollPosition('scrollY', 'scrollTop');
  }


  function getScrollX() {
    return getScrollPosition('scrollX', 'scrollLeft');
  }

  function findHighestElement() {
    let largestElement = document.documentElement;
    let largestHeight = document.documentElement.clientHeight;

    document.querySelectorAll('*').forEach(element => {
      const { offsetHeight } = element;
      if (offsetHeight > largestHeight) {
        largestHeight = offsetHeight;
        largestElement = element;
      }
    });

    return largestElement;
  }


  function onMessage(message, sender, callback) {
    if (message.messageType === MSG_TYPE_SCROLLPAGE) {
      takeFullPageScreenshot(callback);
      return true;
    }
    if (message.messageType === MSG_TYPE_LOGGING) {
      console.log('popup> ', message.data);
      return true;
    }
    return false;
  }



  function findMax(nums) {
    return Math.max(...nums.filter(Boolean));
  }


  /**
   * Returns an array of dimensions based on the given dimension parameter.
   *
   * @param {string} dimension - The dimension ("Width" or "Height") to retrieve the dimensions for.
   */
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



  function calculateScrollArrangements(totalWidth, totalHeight, windowWidth, windowHeight, scrollPads) {

    if (totalWidth <= windowWidth && totalHeight <= windowHeight) {
      return [{
        scrollToX:0,
        scrollToY:0,
        sx: 0,
        sy: 0,
        sw: windowWidth,
        sh: windowHeight,
        dx: 0,
        dy: 0,
        dw: windowWidth,
        dh: windowHeight
      }];
    }

    const sumPad = scrollPads.top + scrollPads.bottom;
    const dy = windowHeight <= sumPad ? windowHeight : (windowHeight - sumPad);

    const arrangements = [];
    const dx = windowWidth;

    // See: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
    const topShot = {
      scrollToX:0,
      scrollToY:0,
      sx: 0,
      sy: 0,
      sw: windowWidth,
      sh: (windowHeight - scrollPads.bottom),
      dx: 0,
      dy: 0,
      dw: windowWidth,
      dh: (windowHeight - scrollPads.bottom)

    };
    const bottomShot = {
      scrollToX:0,
      scrollToY:(totalHeight - windowHeight),
      sx: 0,
      sy: scrollPads.top,
      sw: windowWidth,
      sh: (windowHeight - scrollPads.bottom),
      dx: 0,
      dy: totalHeight - windowHeight + scrollPads.top,
      dw: windowWidth,
      dh: (windowHeight - scrollPads.bottom)
    };

    let y = dy;

    while (y <= totalHeight - dy) {
      let x = 0;
      while (x <= totalWidth - dx) {
        arrangements.push({
          scrollToX:x,
          scrollToY:y,
          sx: 0,
          sy: scrollPads.top,
          sw: dx,
          sh: dy,
          dx: x,
          dy: y,
          dw: dx,
          dh: dy
        });
        x += dx;
      }
      y += dy;
    }
    arrangements.push(bottomShot);
    arrangements.push(topShot);

    return arrangements;
  }

  function wait(ms) {
    return new Promise((resolve, _reject) => {
      setTimeout(resolve, ms);
    });
  }



  async function takeFullPageScreenshot(callback) {
    const he = findHighestElement();
    elementWithScrollToFn = he === document.documentElement ? document.documentElement : he.parentElement;

    const originalX = getScrollX();
    const originalY = getScrollY();

    scrollToXY(0, 0);
    await wait(SCREEN_CAPTURE_DELAY);

    const widths = [he.clientWidth, ...getDimensions('Width')];
    const heights = [he.clientHeight, ...getDimensions('Height')];

    const totalWidth = findMax(widths);
    const totalHeight = findMax(heights);

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scrollPads = {top: 200, bottom: 100};
    const arrangements = calculateScrollArrangements(totalWidth, totalHeight, windowWidth, windowHeight, scrollPads);

    const fns = arrangements.map(
      (a, idx) => {
        return async () => nextCapture(a, idx / arrangements.length, windowWidth, totalWidth, totalHeight)
      }
    );
    for (const fn of fns) {
      await fn();
    }

    scrollToXY(originalX, originalY);
    if (callback) {
      callback();
    }
    return true;
  }

  function nextCapture(
    arrangement,
    complete,
    windowWidth,
    totalWidth,
    totalHeight) {

    return new Promise((resolve, reject) => {

      scrollToXY(arrangement.scrollToX, arrangement.scrollToY);

      const data = {
        messageType: MSG_TYPE_CAPTURE,
        arrangement,
        x: arrangement.scrollToX,
        y: arrangement.scrollToY,
        complete,
        windowWidth,
        totalWidth,
        totalHeight,
        devicePixelRatio: window.devicePixelRatio
      };

      window.setTimeout(() => {
        chrome.runtime.sendMessage(data, captured => {
          if (captured) {
            resolve();
          } else {
            reject();
          }
        });
      }, SCREEN_CAPTURE_DELAY);
    });
  }


  // init:
  if (!window.hasScreenCapturePage) {
    window.hasScreenCapturePage = true;
    window['screenCaptureLoaded'] = true;
    chrome.runtime.onMessage.addListener(onMessage);
  }

}
