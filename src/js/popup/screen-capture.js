export const CaptureUtil = (() => {

  const debugging = window.location.href.includes('debug=1');

  const MSG_TYPE_CAPTURE = 'capture';
  const MSG_TYPE_LOGGING = 'logging';
  const MSG_TYPE_SCROLLPAGE = 'scrollPage';

  const CAPTURE_STEP_DELAY = 500;
  const MAXIMUM_HEIGHT = 2*8192;
  const MAXIMUM_WIDTH = 4096;
  const MAXIMUM_AREA = MAXIMUM_HEIGHT * MAXIMUM_WIDTH;
  const ALLOWED_URL_PATTERNS = ['http://*/*', 'https://*/*', 'ftp://*/*', 'file://*/*'];
  const DISALLOWED_URL_REGEX = [/^https?:\/\/chrome.google.com\/.*$/];

  const progressbar = document.querySelector("progress");
  const progressNumberFormat = new Intl.NumberFormat('en-EN', {maximumSignificantDigits: 1});
  const screenshotFileName = `page-screenshot.png`;

  const divText = document.querySelector(".text-div");
  const listener = {onCompleted, onError, onProgress, onSplitting: ()=> imageIndex++};

  let currentTab;
  let resultWindowId;
  let imageIndex = 0;


  /**
   * Sends a logging message to the current tab using Chrome extension's `sendMessage` method.
   *
   * @param {any} data - The data to be logged.
   *
   * @return {void}
   */
  function logging(data){
    chrome.tabs.sendMessage(currentTab.id, {
      messageType: MSG_TYPE_LOGGING,
      data
    }, () => {
    });
  }


  /**
   * Checks if a given URL is allowed based on a set of patterns.
   *
   * @param {string} url - The URL to be checked.
   *
   * @return {boolean} - Returns true if the URL is allowed, otherwise false.
   */
  function isUrlAllowed(url) {
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


  /**
   * Starts capturing the content of a specified tab.
   *
   * @param {number} tabId - The ID of the tab to capture.
   * @param {function} captureCompleteCallback - The callback function to be called when the capture is complete.
   * @return {void}
   */
  function startCapture(tabId, captureCompleteCallback) {
    imageIndex = 0;
    chrome.tabs.sendMessage(tabId, {messageType: MSG_TYPE_SCROLLPAGE}, () => {
      captureCompleteCallback();
    });
  }

  /**
   * Suspends the execution for a specified amount of time.
   *
   * @param {number} ms - The number of milliseconds to wait.
   *
   * @return {Promise} - A Promise that resolves after the specified time has passed.
   */
  async function wait(ms) {
    return new Promise((resolve, _reject) => setTimeout(resolve, ms));
  }

  /**
   * Adjusts the data object to fit the scale of an image.
   *
   * @param {object} data - The data object to adjust.
   * @param {object} image - The image object.
   */
  function adjustToScale(data, image) {
    const scale = image.width / data.windowWidth;
    data.x *= scale;
    data.y *= scale;
    data.totalWidth *= scale;
    data.totalHeight *= scale;
  }

  /**
   * Initializes the screenshots array by pushing new screenshots into it.
   *
   * @param {object} data - Object containing totalWidth and totalHeight properties.
   * @param {array} screenshots - Array to store the screenshots.
   * @param {function} splitnotifier - Function to call if the screenshots array length is greater than 1.
   * @returns {void}
   */
  function initializeScreenshots(data, screenshots, splitnotifier) {
    Array.prototype.push.apply(screenshots, initCanvases(data.totalWidth, data.totalHeight));
    if (screenshots.length > 1 && splitnotifier) {
      splitnotifier();
    }
  }

  /**
   * Processes an image by adjusting its scale, initializing screenshots, filtering
   * the screenshots based on given parameters, and sending the processed data as a response.
   *
   * @param {object} data - The data object to be processed.
   * @param {CanvasImageSource} image - The image object.
   * @param {array} screenshots - The array of screenshots.
   * @param {object} onSplitting - The splitnotifier object.
   * @param {function} onSendResponse - The function used to send the response.
   *
   * @return {void}
   */
  function processImage(data, image, screenshots, onSplitting, onSendResponse) {
    data.image = {width: image.width, height: image.height};

    if (data.windowWidth !== image.width) {
      adjustToScale(data, image);
    }

    if (!screenshots.length) {
      initializeScreenshots(data, screenshots, onSplitting);
    }
    logging({title:'processImage()', ...data}); // TODO del



    filterScreenshots(data.x, data.y, image.width, image.height, screenshots)
      .forEach(screenshot => {
      screenshot.ctx.drawImage(image, data.x - screenshot.left, data.y - screenshot.top);
    });

    onSendResponse(JSON.stringify(data, null, 4) || true);
  }



  /**
   * Loads an image asynchronously from the provided URL.
   *
   * @param {string} url - The URL of the image to load.
   * @returns {Promise} A promise that resolves with the loaded image or rejects with an error.
   */
  async function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
  }

  /**
   * Asynchronously captures the currently visible tab as an image, processes it, and performs actions based on the processed data.
   *
   * @param {Object} data - Additional data for processing the captured image.
   * @param {Array} screenshots - Existing screenshots to compare with the captured image.
   * @param {Function} onSendResponse - Callback function to send processed data to the caller.
   * @param {Function} onSplitting - Callback function to notify when the captured image is split.
   */
  async function capture(data, screenshots, onSendResponse, onSplitting) {
    logging(`x:${data.x}, y:${data.y}`); // TODO delete
    await wait(CAPTURE_STEP_DELAY);
    const dataURI = await chrome.tabs.captureVisibleTab(null, {format:'png'});

    if (dataURI) {
      let image = await loadImage(dataURI);

      if (image) {
        processImage(data, image, screenshots, onSplitting, onSendResponse);
        image = null;
      }
    }
  }


  /**
   * Initializes screenshots based on the given total width and height.
   *
   * @param {number} totalWidth - The total width of the screenshots.
   * @param {number} totalHeight - The total height of the screenshots.
   * @return {Object[]} - An array of split canvases representing the screenshots.
   */
  function initCanvases(totalWidth, totalHeight) {
    const badSize = (totalHeight > MAXIMUM_HEIGHT || totalWidth > MAXIMUM_HEIGHT || totalHeight * totalWidth > MAXIMUM_AREA);
    const biggerWidth = totalWidth > totalHeight;

    const maxWidth = (!badSize ? totalWidth : (biggerWidth ? MAXIMUM_HEIGHT : MAXIMUM_WIDTH));
    const maxHeight = (!badSize ? totalHeight : (biggerWidth ? MAXIMUM_WIDTH : MAXIMUM_HEIGHT));

    const numCols = Math.ceil(totalWidth / maxWidth);
    const numRows = Math.ceil(totalHeight / maxHeight);

    return createSplitCanvases(numRows, numCols, maxWidth, maxHeight, totalWidth, totalHeight);
  }

  /**
   * Creates an array of split canvases based on the given parameters.
   * @param {number} numRows - The number of rows for the split canvases.
   * @param {number} numCols - The number of columns for the split canvases.
   * @param {number} maxWidth - The maximum width for each split canvas.
   * @param {number} maxHeight - The maximum height for each split canvas.
   * @param {number} totalWidth - The total width of the split canvases.
   * @param {number} totalHeight - The total height of the split canvases.
   * @return {Array} - An array of split canvases with their associated properties.
   */
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


  /**
   * This function filters screenshots based on the specified image dimensions and position.
   * @param {number} imgLeft - The left coordinate of the image.
   * @param {number} imgTop - The top coordinate of the image.
   * @param {number} imgWidth - The width of the image.
   * @param {number} imgHeight - The height of the image.
   * @param {Array<object>} screenshots - An array of screenshot objects to be filtered.
   * @returns {Array<object>} - The filtered array of screenshot objects.
   */
  function filterScreenshots(imgLeft, imgTop, imgWidth, imgHeight, screenshots) {
    const imgRight = imgLeft + imgWidth, imgBottom = imgTop + imgHeight;
    return screenshots.filter(screenshot => (imgLeft < screenshot.right && imgRight > screenshot.left && imgTop < screenshot.bottom && imgBottom > screenshot.top));
  }


  /**
   * Creates a byte buffer from a given data URI.
   *
   * @param {string} dataURI - The data URI to create the byte buffer from.
   * @return {ArrayBuffer} - The byte buffer created from the data URI.
   */
  function createByteBufferFromDataURI(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const byteBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(byteBuffer);
    for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }

    return byteBuffer;
  }

  /**
   * Retrieves the MIME type from a given Data URI.
   *
   * @param {string} dataURI - The Data URI to extract the MIME type from.
   * @return {string} The extracted MIME type.
   */
  function getMimeType(dataURI) {
    return dataURI.split(',')[0].split(':')[1].split(';')[0];
  }

  /**
   * Returns an array of Blobs generated from the screenshots provided.
   *
   * @param {Array} screenshots - The array of screenshots to be converted into Blobs.
   * @returns {Array} - An array of Blobs generated from the provided screenshots.
   */
  function getBlobsFromScreenshots(screenshots) {
    return screenshots.map(screenshot => {
      const dataURI = screenshot.canvas.toDataURL();
      const byteBuffer = createByteBufferFromDataURI(dataURI);
      const mimeString = getMimeType(dataURI);
      return new Blob([byteBuffer], {type: mimeString});
    });
  }


  /**
   * Writes a blob to the given file entry.
   *
   * @param {FileEntry} fileEntry - The file entry to write to.
   * @param {Blob} blob - The blob to write.
   * @param {Function} onError - The error callback function.
   * @return {void}
   */
  async function writeToFile(fileEntry, blob, onError) {
    try {
      const fileWriter = await new Promise((resolve, reject) => fileEntry.createWriter(resolve, reject));
      fileWriter.onwriteend = () => {};
      fileWriter.write(blob);
    } catch (err) {
      onError(`Error occurred while writing to file. ${err}`)
      console.error("Error occurred while writing to file: ", err);
    }
  }

  /**
   * Generates a URL for a given filename.
   *
   * @param {string} filename - The filename to generate a URL for.
   * @return {string} The generated URL.
   */
  function generateURL(filename) {
    const extensionId = chrome.i18n.getMessage('@@extension_id');
    return `filesystem:chrome-extension://${extensionId}/temporary/${filename}`;
  }

  /**
   * Requests a file system using the requestFileSystem method and writes a Blob object to a file.
   *
   * @param {Blob} blob - The Blob object to write to the file.
   * @param {string} filename - The name of the file to be created.
   * @returns {Promise<string>} - A Promise that resolves to the generated URL of the file if successful,
   *   or rejects with an error if there was a failure.
   */
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

  /**
   * Requests a file system of the specified type and size.
   *
   * @param {number} type - The type of the file system to request. Can be either window.TEMPORARY or window.PERSISTENT.
   * @param {number} size - The requested size of the file system, in bytes.
   * @return {Promise<FileSystem>} A Promise that is resolved when the file system is successfully requested. The resolved value is the requested file system.
   * @throws {DOMException} If an error occurs while requesting the file system, the Promise is rejected with a {@link DOMException}.
   */
  function requestFileSystem(type, size) {
    return new Promise((resolve, reject) => {
      const fn = window.requestFileSystem || window.webkitRequestFileSystem;
      fn(type, size, resolve, reject);
    });
  }

  /**
   * Retrieves the root file object with the given filename.
   *
   * @param {FileSystemDirectoryHandle} root - The root directory handle.
   * @param {string} filename - The name of the file to retrieve.
   * @param {object} [options] - Optional parameters to be passed during the retrieval.
   * @returns {Promise<FileSystemFileHandle>} A promise that resolves with the file handle of the root file object.
   *                                         If the file cannot be retrieved, the promise will be rejected.
   */
  function getRootFile(root, filename, options) {
    return new Promise((resolve, reject) => {
      root.getFile(filename, options, resolve, reject);
    });
  }


  /**
   * Saves a blob to the filesystem with the given filename.
   *
   * @param {Blob} blob - The blob to be saved.
   * @param {string} filename - The desired filename for the saved blob.
   * @param {number} index - The index used to add a suffix to the filename.
   * @return {Promise} - A promise that resolves or rejects depending on the success of the save operation.
   */
  function saveBlob(blob, filename, index) {
    filename = addFilenameSuffix(filename, index);

    return requestFileSystemAndWrite(blob, filename);
  }


  /**
   * Adds a suffix to the filename at the specified index.
   *
   * @param {string} filename - The original filename.
   * @param {number} index - The index to add the suffix at.
   * @return {string} - The new filename with the suffix added.
   */
  function addFilenameSuffix(filename, index) {
    if (!index) {
      index = 0;
    }
    let indexStr = (index + 1).toString().padStart(2, '0');
    if (filename.includes('.')) {
      const sp = filename.split('.');
      const ext = sp.pop();
      return `${sp.join('.')}-${indexStr}.${ext}`;
    }

    return `${filename}-${indexStr}`
  }




  /**
   * Captures screenshots of a web page and saves them as blobs.
   *
   * @param {Object} tab - The tab object representing the web page.
   * @param {Object} listener - The listener object containing event callbacks.
   *
   * @param {Function} listener.onCompleted - The callback function called when capturing is completed.
   * @param {Function} listener.onError - The callback function called when an error occurs.
   * @param {Function} listener.onProgress - The callback function called to report the progress of capturing.
   * @param {Function} listener.onSplitting - The callback function called when the page is being split.
   */
  function captureToBlobs(tab, listener) {
    const {onCompleted, onError, onProgress, onSplitting} = listener;
    let loaded = false;
    const screenshots = [];
    const SINGLE_CAPTURE_TIMEOUT = 3000;
    const tabId = tab.id;

    if (!isUrlAllowed(tab.url)) {
      onError('Oops! It seems that this page is not allowed to be analyzed.');
    }

    chrome.runtime
      .onMessage
      .addListener((message, sender, onSendResponse) => {
        if (message.messageType === MSG_TYPE_CAPTURE) {
          onProgress(message.complete);
          capture(message, screenshots, onSendResponse, onSplitting);
          return true;
        }

        if (message.messageType === MSG_TYPE_LOGGING) {
          console.log(message.data);
          return true;
        }

        console.info("Unknown message received from content script: " + message.msg);
        onError("internal error");
        return false;
      });

    const scriptLoaded = false;
    try {
      if (scriptLoaded) {
        startCaptering(tabId, screenshots, onCompleted);

      } else {
        const now = Date.now();
        return chrome.scripting.executeScript({
          target: {tabId}, files: ['js/inject/screen-capture-page.js']
        })
          .then((_res) => {
            if (!loaded && Date.now() - now > SINGLE_CAPTURE_TIMEOUT) {
            } else {
              loaded = true;
              startCaptering(tabId, screenshots, onCompleted);
            }
          });
      }
    } catch (err) {
      console.error(`Failed to execute script: ${err}`);
    }
  }



  /**
   * Starts capturing screenshots from a given tab.
   *
   * @param {string} tabId - The tab id to capture the screenshots from.
   * @param {Array} screenshots - Array of screenshots to capture.
   * @param {function} onCompleted - A callback function to be called when capturing is completed. Accepts an array of blobs representing captured screenshots as an argument.
   *
   * @return {void}
   */
  function startCaptering(tabId, screenshots, onCompleted){
    onProgress(0);
    startCapture(tabId, () => {
      onCompleted(getBlobsFromScreenshots(screenshots));
    });
  }


  /**
   * Save multiple blobs with specified filenames.
   *
   * @param {Blob[]} blobs - Array of blobs to save.
   * @param {string} filename - Filename to prefix the saved blobs.
   *
   * @return {Promise<string[]>} - Array of saved filenames.
   */
  async function saveBlobs(blobs, filename) {
    const filenames = [];
    for (const [index, blob] of blobs.entries()) {
      const fn = await saveBlob(blob, filename, index);
      filenames.push(fn);
    }
    return filenames;
  }



  /**
   * Captures the contents of a tab and saves them to files.
   *
   * @param {object} tab - The tab object to capture.
   *
   * @return {void}
   */
  function captureToFiles(tab) {
    currentTab = tab;
    const {onCompleted} = listener;

    setProgressbarVisible(true);

    captureToBlobs(tab, {
      ...listener,
      onCompleted: async blobs => {
        const filenames = await saveBlobs(blobs, screenshotFileName);
        const htmlFileName = await saveShowImagesHtml(filenames);
        // onCompleted([htmlFileName, ...filenames], undefined);
        onCompleted([htmlFileName], undefined);
      }
    });
  }

  async function saveShowImagesHtml(filenames) {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Screenshot Images</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background-color: #000;
      color: #fff;
      min-width: 100%;
      height: 100%;
    }
    .images-div {
      min-width: 100vw;
      height: 100vh;
      display: flex;
      float: left;
      justify-content: center;
    }
    .images-div img {
      margin-right: 16px;
    }
  </style>
</head>
<body>
<div class="images-div">
  XXX
</div>
</body>
</html>  

`;

    const s = filenames.map(n=> `<img alt="screenshot" src=${n}>`);
    html = html.replace(/XXX/g, s);

    const filename = screenshotFileName.replace(/png/, 'html');
    const blob = new Blob([html], { type: 'text/html' });
    return await requestFileSystemAndWrite(blob, filename);
  }


  /**
   * Sets the visibility of the progress bar.
   *
   * @param {boolean} b - Specifies whether the progress bar should be visible or not.
   * @return {undefined}
   */
  function setProgressbarVisible(b) {
    progressbar.value = 0;
    if (b) {
      progressbar.classList.remove('hidden');
    } else {
      progressbar.classList.add('hidden');
    }
  }

  /**
   * Updates the progress of capturing
   *
   * @param {number} f - The progress of capturing, between 0 and 1
   *
   * @return {void}
   */
  function onProgress(f) {
    if (f >= 1) {
      divText.innerText = `Capturing... done`;
    } else {
      progressbar.value = f * 100;
      const n = progressNumberFormat.format(f * 100);
      divText.innerText = `Capturing... ${n}% `;
    }
  }

  /**
   * Sets the error message in the palette element.
   *
   * @param {string} err - The error message to display.
   */
  function onError(err) {
    divText.innerHTML = `<span class="ge-error-color">${err}</span>`;
  }

  /**
   * Function to handle the completion of the screen capture task.
   *
   * @param {Array} filenames - Array of filenames representing the captured screens.
   * @param {number} index - Index indicating the current position in the filenames array. Defaults to 0.
   * @returns {void}
   */
  function onCompleted(filenames, index) {
    setProgressbarVisible(false);
    if (!filenames.length) {
      console.info('Error: no screen captured!');
      return;
    }
    index = index || 0;

    const url = filenames[index];
    const last = index === filenames.length - 1;

    if (currentTab.incognito && index === 0) {
      // incognito -> non incognito
      chrome.windows.create({
        url: url,
        incognito: false,
        focused: last
      }, win => {
        resultWindowId = win.id;
      });
    } else {
      chrome.tabs.create({
        url: url,
        active: last,
        windowId: resultWindowId,
        openerTabId: currentTab.id,
        index: (currentTab.incognito ? 0 : currentTab.index) + 1 + index
      });
    }

    if (!last) {
      onCompleted(filenames, index + 1);
    }
  }


  return {
    captureToFiles
  };

})();

