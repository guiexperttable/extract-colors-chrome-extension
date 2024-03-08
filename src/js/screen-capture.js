const CaptureUtil = (() => {

  const CAPTURE_STEP_DELAY = 300;
  const MAXIMUM_HEIGHT = 15000 * 2;
  const MAXIMUM_WIDTH = 4000 * 2;
  const MAXIMUM_AREA = MAXIMUM_HEIGHT * MAXIMUM_WIDTH;
  const ALLOWED_URL_PATTERNS = ['http://*/*', 'https://*/*', 'ftp://*/*', 'file://*/*'];
  const DISALLOWED_URL_REGEX = [/^https?:\/\/chrome.google.com\/.*$/];


  function isURLAllowed(url) {
    let regExp, index;
    for (index = DISALLOWED_URL_REGEX.length - 1; index >= 0; index--) {
      if (DISALLOWED_URL_REGEX[index].test(url)) {
        return false;
      }
    }
    for (index = ALLOWED_URL_PATTERNS.length - 1; index >= 0; index--) {
      regExp = new RegExp('^' + ALLOWED_URL_PATTERNS[index].replace(/\*/g, '.*') + '$');
      if (regExp.test(url)) {
        return true;
      }
    }
    return false;
  }

  function startCapture(tab, captureCompleteCallback) {
    chrome.tabs.sendMessage(tab.id, {msg: 'scrollPage'}, () => {
      captureCompleteCallback();
    });
  }

  async function wait(ms) {
    return new Promise((resolve, _reject) => setTimeout(resolve, ms));
  }

  function adjustToScale(data, image) {
    const scale = image.width / data.windowWidth;
    data.x *= scale;
    data.y *= scale;
    data.totalWidth *= scale;
    data.totalHeight *= scale;
  }

  function initializeScreenshots(data, screenshots, splitnotifier) {
    Array.prototype.push.apply(screenshots, initScreenshots(data.totalWidth, data.totalHeight));
    if (screenshots.length > 1 && splitnotifier) {
      splitnotifier();
      console.log('screen count:', screenshots.length);
    }
  }

  function processImage(data, image, screenshots, splitnotifier, sendResponse) {
    data.image = {width: image.width, height: image.height};

    if (data.windowWidth !== image.width) {
      adjustToScale(data, image);
    }

    if (!screenshots.length) {
      initializeScreenshots(data, screenshots, splitnotifier);
    }

    filterScreenshots(data.x, data.y, image.width, image.height, screenshots).forEach(screenshot => {
      screenshot.ctx.drawImage(image, data.x - screenshot.left, data.y - screenshot.top);
    });

    sendResponse(JSON.stringify(data, null, 4) || true);
  }

  async function capture(data, screenshots, sendResponse, splitnotifier) {
    await wait(CAPTURE_STEP_DELAY);

    const dataURI = await chrome.tabs.captureVisibleTab(null, {format: 'png'});
    if (dataURI) {
      const image = new Image();
      image.onload = () => processImage(data, image, screenshots, splitnotifier, sendResponse);
      image.src = dataURI;
    }
  }


  function initScreenshots(totalWidth, totalHeight) {
    const badSize = (totalHeight > MAXIMUM_HEIGHT || totalWidth > MAXIMUM_HEIGHT || totalHeight * totalWidth > MAXIMUM_AREA);
    const biggerWidth = totalWidth > totalHeight;

    const maxWidth = (!badSize ? totalWidth : (biggerWidth ? MAXIMUM_HEIGHT : MAXIMUM_WIDTH));
    const maxHeight = (!badSize ? totalHeight : (biggerWidth ? MAXIMUM_WIDTH : MAXIMUM_HEIGHT));

    const numCols = Math.ceil(totalWidth / maxWidth);
    const numRows = Math.ceil(totalHeight / maxHeight);

    return createSplitCanvases(numRows, numCols, maxWidth, maxHeight, totalWidth, totalHeight);
  }

  function createSplitCanvases(numRows, numCols, maxWidth, maxHeight, totalWidth, totalHeight) {
    const result = [];
    let canvasIndex = 0;

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const canvas = document.createElement('canvas');
        canvas.width = (col === numCols - 1 ? totalWidth % maxWidth || maxWidth : maxWidth);
        canvas.height = (row === numRows - 1 ? totalHeight % maxHeight || maxHeight : maxHeight);
        const left = col * maxWidth;
        const top = row * maxHeight;
        result.push({
          canvas: canvas,
          ctx: canvas.getContext('2d'),
          index: canvasIndex,
          left: left,
          right: left + canvas.width,
          top: top,
          bottom: top + canvas.height
        });
        canvasIndex++;
      }
    }
    return result;
  }


  function filterScreenshots(imgLeft, imgTop, imgWidth, imgHeight, screenshots) {
    const imgRight = imgLeft + imgWidth, imgBottom = imgTop + imgHeight;
    return screenshots.filter(screenshot => (imgLeft < screenshot.right && imgRight > screenshot.left && imgTop < screenshot.bottom && imgBottom > screenshot.top));
  }


  function getBlobs(screenshots) {
    return screenshots.map(screenshot => {
      const dataURI = screenshot.canvas.toDataURL();

      // convert base64 to raw binary data held in a string doesn't handle URLEncoded DataURIs
      const byteString = atob(dataURI.split(',')[1]);

      // separate out the mime component
      const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

      // write the bytes of the string to an ArrayBuffer
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      // create a blob for writing to a file
      return new Blob([ab], {type: mimeString});
    });
  }


// Extracted constant
  const reqFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

// Extracted functions
  function writeToFile(fileEntry, blob, onwriteend, errback) {
    fileEntry.createWriter(fileWriter => {
      fileWriter.onwriteend = onwriteend;
      fileWriter.write(blob);
    }, errback);
  }

  function requestFileSystemAndWrite(blob, filename, size, onwriteend, errback) {
    reqFileSystem(window.TEMPORARY, size, fs => {
      fs.root.getFile(filename, {create: true}, fileEntry => {
        writeToFile(fileEntry, blob, onwriteend, errback);
      }, errback);
    }, errback);
  }

  // Updated `saveBlob` function
  function saveBlob(blob, filename, index, callback, errback) {
    filename = addFilenameSuffix(filename, index);

    function onwriteend() {
      const urlName = generateURL(filename);
      callback(urlName);
    }

    function generateURL(filename) {
      const extensionId = chrome.i18n.getMessage('@@extension_id');
      return `filesystem:chrome-extension://${extensionId}/temporary/${filename}`;
    }

    // buffer for file-system size
    const size = blob.size + (1024 / 2);

    requestFileSystemAndWrite(blob, filename, size, onwriteend, errback);
  }


  function addFilenameSuffix(filename, index) {
    if (!index) {
      return filename;
    }
    const sp = filename.split('.');
    const ext = sp.pop();
    return sp.join('.') + '-' + (index + 1) + '.' + ext;
  }


  function captureToBlobs(tab, callback, errback, progress, splitnotifier) {
    let loaded = false;
    const screenshots = [], timeout = 3000;
    let timedOut = false;
    const noop = () => {
    };

    callback = callback || noop;
    errback = errback || noop;
    progress = progress || noop;

    if (!isURLAllowed(tab.url)) {
      errback('invalid url'); // TODO errors
    }

    // TODO will this stack up if run multiple times? (I think it will get cleared?)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.msg === 'capture') {
        progress(request.complete);
        capture(request, screenshots, sendResponse, splitnotifier);

        // https://developer.chrome.com/extensions/messaging#simple
        //
        // If you want to asynchronously use sendResponse, add return true;
        // to the onMessage event handler.
        //
        return true;
      } else {
        console.error('Unknown message received from content script: ' + request.msg);
        errback('internal error');
        return false;
      }
    });


    try {
      return chrome.scripting.executeScript({
        target: {tabId: tab.id}, files: ['js/page.js']
      })
        .then((res) => {
          if (timedOut) {
            console.error('Timed out too early while waiting for ' + 'chrome.tabs.executeScript. Try increasing the timeout.');
          } else {
            loaded = true;
            progress(0);

            startCapture(tab, () => {
              callback(getBlobs(screenshots));
            });
          }
        })
    } catch (err) {
      console.error(`Failed to execute script: ${err}`);
    }


    window.setTimeout(() => {
      if (!loaded) {
        timedOut = true;
        errback('execute timeout');
      }
    }, timeout);
  }


  function captureToFiles(tab, filename, callback, errback, progress, splitnotifier) {
    captureToBlobs(tab, blobs => {
      let i = 0;
      const len = blobs.length, filenames = [];

      (function doNext() {
        saveBlob(blobs[i], filename, i, filename => {
          i++;
          filenames.push(filename);
          i >= len ? callback(filenames) : doNext();
        }, errback);
      })();
    }, errback, progress, splitnotifier);
  }


  return {
    captureToBlobs: captureToBlobs, captureToFiles: captureToFiles
  };

})();



/*
async function executeScript(func, ...args) {
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    return chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: func,
      args: [...args]
    })
      .then((res) => {
        if (res) {
          return res[0].result;
        }
        return 'Error';
      })
  } catch (err) {
    console.error(`Failed to execute script: ${err}`);
  }
}

async function getScreenDimensions() {
  return executeScript(() => {
    const zoomFactor = window.devicePixelRatio;
    const viewportHeight = window.innerHeight;
    const scrollHeight = document.body.scrollHeight;
    const clientWidth = document.body.clientWidth;
    const canvasWidth = clientWidth * zoomFactor;
    const canvasHeight = scrollHeight * zoomFactor;
    console.log({
      canvasWidth, canvasHeight, viewportHeight, clientWidth, scrollHeight, zoomFactor
    }); // TODO del
    return {
      canvasWidth, canvasHeight, viewportHeight, clientWidth, scrollHeight, zoomFactor
    };
  });
}

async function tweakScrollStyle() {
  return executeScript(() => {
    // inject 'cursor:none' style:
    const poopClowns = ":not(#💩🤡)".repeat(20);
    const cssRules = `${poopClowns} {cursor: none !important}`;
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-todo', 'remove');
    styleElement.appendChild(document.createTextNode(cssRules));
    document.head.appendChild(styleElement);

    // tweak scroll style:
    const htmlEle = document.documentElement;
    const scrollBehavior = htmlEle.style.scrollBehavior;
    const overflow = htmlEle.style.overflow;
    htmlEle.style.scrollBehavior = 'auto'; // Quick, not smooth
    htmlEle.style.overflow = 'hidden'; // Disable all scrollbars
    return {
      scrollBehavior,
      overflow
    };
  });
}

async function restoreScrollStyle(oldStyles) {
  for (const styleKey in oldStyles) {
    await executeScript((k, s) => {
      const htmlEle = document.documentElement;
      htmlEle.style[k] = s;
    }, styleKey, oldStyles[styleKey]);
  }
}

async function scrollToYPos(yPos) {
  return executeScript((yPos) => {

    const scrollElement = getScrollElement();
    if (scrollElement) {
      scrollElement.scrollTo(0, yPos);
    }

    function getScrollElement() {
      if (document.body.scrollHeight > window.innerHeight) {
        return window;
      }
      const divs = Array.from(document.querySelectorAll('div'));
      const scrollElement = divs.find(div => isScrollExceedsHeight(div) && isInView(div));
      return scrollElement ?? window;
    }

    function isScrollExceedsHeight(element) {
      return element.scrollHeight > element.clientHeight || element.scrollHeight > window.clientHeight;
    }

    function isInView(element) {
      const rect = element.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    }

  }, yPos);
}



*/