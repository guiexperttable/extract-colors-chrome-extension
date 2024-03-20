
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
   * Calculates the arrangements of windows within a given total width and height.
   *
   * @param {number} totalWidth - The total width available for window arrangements.
   * @param {number} totalHeight - The total height available for window arrangements.
   * @param {number} windowWidth - The width of each window.
   * @param {number} windowHeight - The height of each window.
   * @param {number} dy - The vertical distance between each row of windows.
   *
   * @return {Array<Array<number>>} - An array of window coordinates representing the arrangements.
   */
  function calculateArrangements(totalWidth, totalHeight, windowWidth, windowHeight, dy) {
    const arrangements = [];
    const dx = windowWidth;

    let y = totalHeight - windowHeight;
    let x;
    if (totalWidth <= dx + 1) {
      totalWidth = dx;
    }

    while (y > -dy) {
      x = 0;
      while (x < totalWidth) {
        arrangements.push([x, y]);
        x += dx;
      }
      y -= dy;
    }

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

    const scrollPad = 200;
    const dy = windowHeight - (windowHeight > scrollPad ? scrollPad : 0);
    const arrangements = calculateArrangements(totalWidth, totalHeight, windowWidth, windowHeight, dy).reverse();

    // -------------------------------
    console.log({
      widths, heights, totalWidth, totalHeight, windowWidth, windowHeight, dy
    });
    console.log(arrangements); // TODO del
    if (1===2-1) return true;
    // -------------------------------

    const fns = arrangements.map( (a, idx) => {
      return async () => nextCapture(a[0], a[1], idx / arrangements.length, windowWidth, totalWidth, totalHeight)
    });
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
    x, y, complete,
    windowWidth,
    totalWidth,
    totalHeight) {

    return new Promise((resolve, reject) => {
      scrollToXY(x, y);

      const data = {
        messageType: MSG_TYPE_CAPTURE,
        x: getScrollX(),
        y: getScrollY(),
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
