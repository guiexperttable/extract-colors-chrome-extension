
if (!window['screenCaptureLoaded']) {

  const SCREEN_CAPTURE_DELAY = 500;
  const MSG_TYPE_CAPTURE = 'capture';
  const MSG_TYPE_LOGGING = 'logging';
  const MSG_TYPE_SCROLLPAGE = 'scrollPage';

  const scrollYSource = window;
  let elementWithScrollToFn = document.documentElement;



  /**
   * Scrolls the window and the element with scrollTo method to the given X and Y coordinates.
   *
   * @param {number} x - The X coordinate to scroll to.
   * @param {number} y - The Y coordinate to scroll to.
   *
   * @return {undefined}
   */
  function scrollToXY(x, y) {
    window.scrollTo(x, y);
    elementWithScrollToFn.scrollTo(x, y);
  }




  /**
   * Retrieves the scroll position of the window or element based on the given properties.
   *
   * @param {string} windowProperty - The property name representing the scroll position of the window.
   * @param {string} elementProperty - The property name representing the scroll position of the element.
   * @returns {number} The scroll position of the window or element.
   */
  function getScroll(windowProperty, elementProperty) {
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

  /**
   * Retrieves the vertical scroll position of the given element.
   *
   * @return {number} - The vertical scroll position of the element.
   */
  function getScrollY() {
    return getScroll('scrollY', 'scrollTop');
  }

  /**
   * Retrieves the horizontal scroll offset of an element.
   *
   * @return {number} - The horizontal scroll offset of the element.
   */
  function getScrollX() {
    return getScroll('scrollX', 'scrollLeft');
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

  /**
   * @function onMessage
   * @description Handles incoming messages
   *
   * @param {Object} message - The message data
   * @param {Object} sender - The sender of the message
   * @param {Function} callback - The callback function to be called after processing the message
   *
   * @return {boolean} - Returns true if the message is known and processed successfully, false otherwise
   */
  function onMessage(message, sender, callback) {
    if (message.messageType === MSG_TYPE_SCROLLPAGE) {
      getPositions(callback);
      return true;
    }
    if (message.messageType === MSG_TYPE_LOGGING) {
      console.log('popup> ', message.data);
      return true;
    }
    return false;
  }


  /**
   * Calculates the maximum value from a given array of non-empty numbers.
   *
   * @param {number[]} nums - An array containing non-empty numbers.
   * @return {number} - The maximum value from the given array.
   */
  function getMaxNonEmpty(nums) {
    return Math.max(...nums.filter(Boolean));
  }


  /**
   * Returns an array of dimensions based on the given dimension parameter.
   *
   * @param {string} dimension - The dimension ("Width" or "Height") to retrieve the dimensions for.
   *
   * @return {array} - An array containing the following dimensions in order:
   * - The client dimension of the document element (document.documentElement).
   * - The scroll dimension of the body element (document.body) or 0 if body is null.
   * - The scroll dimension of the document element (document.documentElement).
   * - The offset dimension of the body element (document.body) or 0 if body is null.
   * - The offset dimension of the document element (document.documentElement).
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



  /**
   * Calculates the arrangements of windows within a given total area.
   *
   * @param {number} totalWidth - The total width of the area.
   * @param {number} totalHeight - The total height of the area.
   * @param {number} windowWidth - The width of each window.
   * @param {number} windowHeight - The height of each window.
   * @param {object} scrollPads - The padding for scrolling within the area.
   * @param {number} scrollPads.top - The top padding for scrolling.
   * @param {number} scrollPads.bottom - The bottom padding for scrolling.
   *
   * @return {Array} - An array of window arrangements with their positions and dimensions.
   */
  function calculateArrangements(totalWidth, totalHeight, windowWidth, windowHeight, scrollPads) {

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


  /**
   * Retrieves the positions of elements on the page in a specific arrangement.
   * @param {function} callback - Optional callback function to execute after capturing positions.
   * @returns {void}
   */
  async function getPositions(callback) {
    const he = findHighestElement();
    elementWithScrollToFn = he === document.documentElement ? document.documentElement : he.parentElement;

    const originalX = getScrollX();
    const originalY = getScrollY();

    scrollToXY(0, 0);
    await wait(SCREEN_CAPTURE_DELAY);

    const widths = [he.clientWidth, ...getDimensions('Width')];
    const heights = [he.clientHeight, ...getDimensions('Height')];

    const totalWidth = getMaxNonEmpty(widths);
    const totalHeight = getMaxNonEmpty(heights);

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scrollPads = {top: 200, bottom: 100};
    const arrangements = calculateArrangements(totalWidth, totalHeight, windowWidth, windowHeight, scrollPads);

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
