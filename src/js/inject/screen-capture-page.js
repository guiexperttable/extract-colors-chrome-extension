
if (!window['screenCaptureLoaded']) {


  const SCREEN_CAPTURE_DELAY = 500;
  const TIMEOUT = 2000;
  const CAPTURE_MSG_KEY = 'capture';
  const LOGGING_MSG_KEY = 'logging';

  let scrollYSource = window;
  let elementWithScrollToFn = document.documentElement;






  function scrollToXY(x, y) {
    //console.log("scrollToXY " + x + ',' + y, elementWithScrollToFn);
    elementWithScrollToFn.scrollTo(x, y);
  }



  /**
   * Retrieves the vertical scroll position of the given element.
   *
   * @return {number} - The vertical scroll position of the element.
   */
  function getScrollY() {
    // console.log('üü', elementWithScrollToFn.scrollTop);
    if ("scrollTop" in elementWithScrollToFn) {
      let ret = elementWithScrollToFn.scrollTop;
      if (ret !== undefined && ret !== null) {
        console.log('getScrollY() c)', ret);
        return ret;
      }
    }
    if ("scrollTop" in scrollYSource) {
      let ret = scrollYSource.scrollTop;
      if (ret !== undefined && ret !== null) {
        console.log('getScrollY() a)', ret);
        return ret;
      }
    }
    console.log('getScrollY() b)', scrollYSource.scrollY);
    return scrollYSource.scrollY;
  }


  /**
   * Retrieves the horizontal scroll offset of an element.
   *
   * @param {HTMLElement} ele - The element from which to retrieve the scroll offset.
   * @return {number} - The horizontal scroll offset of the element.
   */
  function getScrollX() {
    if ("scrollLeft" in elementWithScrollToFn) {
      let ret = elementWithScrollToFn.scrollLeft;
      if (ret !== undefined && ret !== null) {
        console.log('getScrollX() c)', ret);
        return ret;
      }
    }
    if ("scrollLeft" in scrollYSource) {
      let ret = scrollYSource.scrollLeft;
      if (ret !== undefined && ret !== null) {
        return ret;
      }
    }
    return scrollYSource.scrollX;
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
   * @param {Object} data - The message data
   * @param {Object} sender - The sender of the message
   * @param {Function} callback - The callback function to be called after processing the message
   *
   * @return {boolean} - Returns true if the message is known and processed successfully, false otherwise
   */
  function onMessage(data, sender, callback) {
    console.info('onMessage',data);
    if (data.msg === 'scrollPage') {
      getPositions(callback);
      return true;
    }
    if (data.msg === LOGGING_MSG_KEY) {
      console.log('from popup', data);
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
    //console.log('he', he);// TODO delete
    //console.log('he.clientHeight', he.clientHeight);// TODO delete
    elementWithScrollToFn = he === document.documentElement ? document.documentElement : he.parentElement;
    scrollYSource = he === document.documentElement ? window : he;

    // TODO delete:
    //console.log('scrollYSource', scrollYSource);
    //console.log('scrollYSource.scrollTop', scrollYSource.scrollTop);
    //console.log('scrollYSource.scrollY', scrollYSource.scrollY);
    //console.log('elementWithScrollToFn', elementWithScrollToFn);
    //console.log('elementWithScrollToFn.clientHeight', elementWithScrollToFn.clientHeight);
    console.log('getScrollY()', getScrollY());

    //const body = document.body;
    const originalX = getScrollX();
    const originalY = getScrollY();
    //const originalBodyOverflowYStyle = body ? body.style.overflowY : '';
    //const originalOverflowStyle = document.documentElement.style.overflow;

    //if (body) {
    //  body.style.overflowY = 'visible';
    //}

    const widths = [he.clientWidth, ...getDimensions('Width')];
    const heights = [he.clientHeight, ...getDimensions('Height')];
    console.log('he.clientHeight', he.clientHeight);
    console.log('heights', heights);

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

    //document.documentElement.style.overflow = 'hidden';

    // TODO DELETE
    console.log({
      originalY, windowHeight, arrangements, dy, y, totalHeight
    });

    console.log('##########################');
    while (y > -dy) {
      x = 0;
      while (x < totalWidth) {
        arrangements.push([x, y]);
        x += dx;
      }
      y -= dy;
    }
    console.log('-----------------------');


    numArrangements = arrangements.length;
    scrollToXY(0, 0);
    console.log('aa) arrangements', JSON.stringify(arrangements, null, 0));  // TODO delete

    let count = 0;

    function cleanUp() {
      //document.documentElement.style.overflow = originalOverflowStyle;
      //if (body) {
      //  body.style.overflowY = originalBodyOverflowYStyle;
      //}
      // window.scrollTo(originalX, originalY);
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

      //console.log('--------------------------------------------');  // TODO delete
      console.log(count +') arrangements', JSON.stringify(arrangements, null, 0));  // TODO delete
      const next = arrangements.shift();

      const x = next[0];
      const y = next[1];
      // console.log({x, y}); // TODO delete

      scrollToXY(x, y);
      // window.scrollTo(x, y);


      const data = {
        msg: CAPTURE_MSG_KEY,
        x: getScrollX(),
        y: getScrollY(),
        complete: (numArrangements - arrangements.length) / numArrangements,
        windowWidth,
        totalWidth,
        totalHeight,
        devicePixelRatio: window.devicePixelRatio
      };


      // console.log(data); // TODO delete

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
          //processArrangements();

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
