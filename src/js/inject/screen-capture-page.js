
if (!window['screenCaptureLoaded']) {


  const SCREEN_CAPTURE_DELAY = 500;
  const TIMEOUT = 2000;

  const MSG_TYPE_CAPTURE = 'capture';
  const MSG_TYPE_LOGGING = 'logging';
  const MSG_TYPE_SCROLLPAGE = 'scrollPage';

  let scrollYSource = window;
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
   * Helper function to get the scroll position.
   *
   * @param {property} windowProperty - Property from window (scrollY, scrollX)
   * @param {property} elementProperty - Property from the element (scrollTop, scrollLeft)
   * @return {number} - The scroll position.
   */
  function getScroll(windowProperty, elementProperty) {
    if (window[windowProperty] > 0) {
      return window[windowProperty];
    }
    for (const ele of [elementWithScrollToFn, scrollYSource]) {
      if (elementProperty in ele) {
        let position = ele[elementProperty];
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
   * Retrieves the positions of elements on the page in a specific arrangement.
   * @param {function} callback - Optional callback function to execute after capturing positions.
   * @returns {void}
   */
  function getPositions(callback) {
    const he = findHighestElement();
    elementWithScrollToFn = he === document.documentElement ? document.documentElement : he.parentElement;

    const originalX = getScrollX();
    const originalY = getScrollY();

    const widths = [he.clientWidth, ...getDimensions('Width')];
    const heights = [he.clientHeight, ...getDimensions('Height')];

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

    while (y > -dy) {
      x = 0;
      while (x < totalWidth) {
        arrangements.push([x, y]);
        x += dx;
      }
      y -= dy;
    }

    numArrangements = arrangements.length;
    scrollToXY(0, 0);

    let count = 0;

    function cleanUp() {
      scrollToXY(originalX, originalY);
    }

    (function processArrangements() {
      if (!arrangements.length) {
        cleanUp();
        if (callback) {
          callback();
        }
        return;
      }

      count++;
      const next = arrangements.shift();
      const x = next[0];
      const y = next[1];
      scrollToXY(x, y);

      const data = {
        messageType: MSG_TYPE_CAPTURE,
        x: getScrollX(),
        y: getScrollY(),
        complete: (numArrangements - arrangements.length) / numArrangements,
        windowWidth,
        totalWidth,
        totalHeight,
        devicePixelRatio: window.devicePixelRatio
      };

      if (count<50) {
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
        }, SCREEN_CAPTURE_DELAY);
      }
    })();
  }


  // init:
  if (!window.hasScreenCapturePage) {
    window.hasScreenCapturePage = true;
    window['screenCaptureLoaded'] = true;
    chrome.runtime.onMessage.addListener(onMessage);
  }

}
