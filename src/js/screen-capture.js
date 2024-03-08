const CaptureUtil = (() => {

  const CAPTURE_STEP_DELAY = 200;
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

  async function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
  }

  async function capture(data, screenshots, sendResponse, splitnotifier) {
    await wait(CAPTURE_STEP_DELAY);
    const dataURI = await chrome.tabs.captureVisibleTab(null, {format: 'png'});

    if (dataURI) {
      const image = await loadImage(dataURI);

      if (image){
        processImage(data, image, screenshots, splitnotifier, sendResponse)
      }
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


  function createByteBufferFromDataURI(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const byteBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(byteBuffer);
    for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }

    return byteBuffer;
  }

  function getMimeType(dataURI) {
    return dataURI.split(',')[0].split(':')[1].split(';')[0];
  }

  function getBlobs(screenshots) {
    return screenshots.map(screenshot => {
      const dataURI = screenshot.canvas.toDataURL();
      const byteBuffer = createByteBufferFromDataURI(dataURI);
      const mimeString = getMimeType(dataURI);
      return new Blob([byteBuffer], {type: mimeString});
    });
  }



  


  async function writeToFile(fileEntry, blob, onError) {
    try {
      const fileWriter = await new Promise((resolve, reject) => fileEntry.createWriter(resolve, reject));
      fileWriter.onwriteend = () => console.log('File write completed');
      fileWriter.write(blob);
    } catch(err) {
      onError(`Error occurred while writing to file. ${err}`)
      console.error("Error occurred while writing to file: ", err);
    }
  }

  function generateURL(filename) {
    const extensionId = chrome.i18n.getMessage('@@extension_id');
    return `filesystem:chrome-extension://${extensionId}/temporary/${filename}`;
  }

  async function requestFileSystemAndWrite(blob, filename) {
    return new Promise(async (resolve, reject) => {
      try {
        const bufferSize = blob.size + (1024 / 2);
        const fs = await requestFileSystem(window.TEMPORARY, bufferSize);
        const fileEntry = await getRootFile(fs.root, filename, {create: true})
        await writeToFile(fileEntry, blob);
        resolve(generateURL(filename));

      } catch (error) {
        reject(error);
      }
    });
  }

  function requestFileSystem(type, size) {
    return new Promise((resolve, reject) => {
      const fn = window.requestFileSystem || window.webkitRequestFileSystem;
      fn(type, size, resolve, reject);
    });
  }

  function getRootFile(root, filename, options) {
    return new Promise((resolve, reject) => {
      root.getFile(filename, options, resolve, reject);
    });
  }


  // Updated `saveBlob` function
  function saveBlob(blob, filename, index) {
    filename = addFilenameSuffix(filename, index);

    return requestFileSystemAndWrite(blob, filename);
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
    const screenshots = [];
    const SINGLE_CAPTURE_TIMEOUT = 3000;
    let timedOut = false;
    const noop = () => {
    };

    callback = callback || noop;
    errback = errback || noop;
    progress = progress || noop;

    if (!isURLAllowed(tab.url)) {
      errback('invalid url'); // TODO errors
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.msg === 'capture') {
        progress(request.complete);
        capture(request, screenshots, sendResponse, splitnotifier);
        return true;
      } else {
        console.error('Unknown message received from content script: ' + request.msg);
        errback('internal error');
        return false;
      }
    });


    try {
      const now = Date.now();
      return chrome.scripting.executeScript({
        target: {tabId: tab.id}, files: ['js/page.js']
      })
        .then((res) => {
          if (!loaded && Date.now() - now > SINGLE_CAPTURE_TIMEOUT) {
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
  }


  async function saveBlobs(blobs, filename) {
    const filenames = [];
    for (const [index, blob] of blobs.entries()) {
      const fn = await saveBlob(blob, filename, index);
      filenames.push(fn);
    }
    return filenames;
  }

  function captureToFiles(tab, filename, onCompleted, onError, onProgress, omSplitting) {
    captureToBlobs(tab, async blobs => {
      const filenames = await saveBlobs(blobs, filename);
      onCompleted(filenames);
    }, onError, onProgress, omSplitting);
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