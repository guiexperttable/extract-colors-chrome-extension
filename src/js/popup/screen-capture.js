export const CaptureUtil = (() => {

  const MSG_TYPE_CAPTURE = 'capture';
  const MSG_TYPE_LOGGING = 'logging';
  const MSG_TYPE_SCROLLPAGE = 'scrollPage';

  const CAPTURE_STEP_DELAY = 500;
  let maximumHeight = 29900;
  const MAXIMUM_WIDTH = 4096;

  const ALLOWED_URL_PATTERNS = ['http://*/*', 'https://*/*', 'ftp://*/*', 'file://*/*'];
  const DISALLOWED_URL_REGEX = [/^https?:\/\/chrome.google.com\/.*$/];

  const progressbar = document.querySelector("progress");
  const progressNumberFormat = new Intl.NumberFormat('en-EN', {maximumSignificantDigits: 1});
  const screenshotFileName = `page-${Math.floor(9999 * Math.random())}-screenshot`;

  const divText = document.querySelector(".text-div");
  const listener = {onCompleted, onError, onProgress, onSplitting: ()=> imageIndex++};

  let currentTab;
  let resultWindowId;
  let imageIndex = 0;


  function logging(data) {
    chrome.tabs.sendMessage(
      currentTab.id,
      {
        messageType: MSG_TYPE_LOGGING,
        data
      },
      () => {}
    );
  }



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



  function startCapture(tabId, captureCompleteCallback) {
    imageIndex = 0;
    chrome.tabs.sendMessage(tabId, {messageType: MSG_TYPE_SCROLLPAGE}, () => {
      captureCompleteCallback();
    });
  }


  async function wait(ms) {
    return new Promise((resolve, _reject) => setTimeout(resolve, ms));
  }



  function initializeScreenshots(dims, screenshots, splitCallback) {
    const createdCanvases = initCanvases(dims.totalWidth, dims.totalHeight);
    screenshots.push(...createdCanvases);

    const hasMultipleScreenshots = screenshots.length > 1;
    if (hasMultipleScreenshots && splitCallback) {
      splitCallback();
    }
  }


  function processImage(data, image, screenshots, onSplitting, onSendResponse) {
    const arrangement = data.arrangement;
    arrangement.image = {width: image.width, height: image.height};

    let {
      sx, sy, sw, sh,
      dx, dy, dw, dh} = arrangement;

    if (data.windowWidth !== image.width) {
      const scale = image.width / data.windowWidth;
      sw *= scale;
      sh *= scale;
      sx *= scale;
      sy *= scale;
    }

    if (!screenshots.length) {
      initializeScreenshots(data, screenshots, onSplitting);
    }

    const screenshotsInBounds = getScreenshotsInBounds(dx, dy, dw, dh, screenshots);
    screenshotsInBounds.forEach(screenshot => {
        const offsetLeft = screenshot.left;
        const offsetTop = screenshot.top;
        screenshot.ctx.drawImage(
          image,
          sx, sy, sw, sh,
          dx - offsetLeft, dy - offsetTop, dw, dh);
      }
    );

    onSendResponse(JSON.stringify(data, null, 4) || true);
  }




  async function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
  }


  async function capture(data, capturingOptions, screenshots, onSendResponse, onSplitting) {

    await wait(CAPTURE_STEP_DELAY);
    const dataURI = await chrome.tabs.captureVisibleTab(null, {
      format:capturingOptions.format,
      quality: capturingOptions.quality
    });

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
    const maximumArea = maximumHeight * MAXIMUM_WIDTH
    const badSize = (totalHeight > maximumHeight || totalWidth > maximumHeight || totalHeight * totalWidth > maximumArea);
    const biggerWidth = totalWidth > totalHeight;

    const maxWidth = (!badSize ? totalWidth : (biggerWidth ? maximumHeight : MAXIMUM_WIDTH));
    const maxHeight = (!badSize ? totalHeight : (biggerWidth ? MAXIMUM_WIDTH : maximumHeight));

    const numCols = Math.ceil(totalWidth / maxWidth);
    const numRows = Math.ceil(totalHeight / maxHeight);

    return createSplitCanvases(numRows, numCols, maxWidth, maxHeight, totalWidth, totalHeight);
  }


  function createSplitCanvases(numRows, numCols, maxWidth, maxHeight, totalWidth, totalHeight) {
    const splitCanvases = [];
    let canvasIndex = 0;

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const canvas = document.createElement('canvas');
        canvas.width = (col === numCols - 1 ? totalWidth % maxWidth || maxWidth : maxWidth);
        canvas.height = (row === numRows - 1 ? totalHeight % maxHeight || maxHeight : maxHeight);
        const left = col * maxWidth;
        const top = row * maxHeight;
        splitCanvases.push({
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
    return splitCanvases;
  }



  function getScreenshotsInBounds(imgLeft, imgTop, imgWidth, imgHeight, screenshots) {
    const imgRight = imgLeft + imgWidth, imgBottom = imgTop + imgHeight;
    return screenshots.filter(screenshot =>
      (imgLeft < screenshot.right
        && imgRight > screenshot.left
        && imgTop < screenshot.bottom
        && imgBottom > screenshot.top
      ));
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


  function getBlobsFromScreenshots(screenshots) {
    return screenshots.map(screenshot => {
      const dataURI = screenshot.canvas.toDataURL();
      const byteBuffer = createByteBufferFromDataURI(dataURI);
      const mimeString = getMimeType(dataURI);
      return new Blob([byteBuffer], {type: mimeString});
    });
  }



  async function writeBlobToFileEntry(fileEntry, blob, onError) {
    try {
      const fileWriter = await new Promise((resolve, reject) => fileEntry.createWriter(resolve, reject));
      fileWriter.onwriteend = () => {};
      fileWriter.write(blob);
    } catch (err) {
      onError(`Error occurred while writing to file. ${err}`)
      console.error("Error occurred while writing to file: ", err);
    }
  }


  function getURLForFile(filename) {
    const extensionId = chrome.i18n.getMessage('@@extension_id');
    return `filesystem:chrome-extension://${extensionId}/temporary/${filename}`;
  }


  async function writeBlobToFile(blob, filename) {
    return new Promise(async (resolve, reject) => {
      try {
        const bufferSize = blob.size; // + (1024 / 2);
        const fs = await requestFileSystem(window.TEMPORARY, bufferSize);
        const fileEntry = await getFileFromRoot(fs.root, filename, {create: true});

        await writeBlobToFileEntry(fileEntry, blob, reject);
        resolve(getURLForFile(filename));

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


  function getFileFromRoot(root, filename, options) {
    return new Promise((resolve, reject) => {
      root.getFile(filename, options, resolve, reject);
    });
  }


  function appendIndexToFilename(filename, index) {
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



  function captureToBlobs(tab, capturingOptions, listener) {
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
          capture(message, capturingOptions, screenshots, onSendResponse, onSplitting);
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



  function startCaptering(tabId, screenshots, onCompleted){
    onProgress(0);
    startCapture(tabId, () => {
      onCompleted(getBlobsFromScreenshots(screenshots));
    });
  }



  async function saveBlobsToNumeratedFile(blobs, filename) {
    const filenames = [];
    for (const [index, blob] of blobs.entries()) {
      filename = appendIndexToFilename(filename, index);
      const fn = await writeBlobToFile(blob, filename);
      filenames.push(fn);
    }
    return filenames;
  }




  function captureToFiles(tab, capturingOptions) {
    document.querySelector(".do-capture-btn").disabled = true;
    currentTab = tab;
    maximumHeight = capturingOptions.maxHeight;

    const {onCompleted} = listener;

    setProgressbarVisible(true);

    captureToBlobs(
      tab,
      capturingOptions,
      {
      ...listener,
      onCompleted: async blobs => {
        const filenames = await saveBlobsToNumeratedFile(blobs, screenshotFileName + '.' + capturingOptions.format);
        const htmlFileName = await saveShowImagesHtml(filenames);

        if (htmlFileName) {
          onCompleted([htmlFileName, ...filenames], undefined);
          // onCompleted([htmlFileName], undefined);
        }
      }
    });
  }

  async function saveShowImagesHtml(filenames) {
    if (!filenames?.length) return '';

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
</html> ${' '.repeat(1000)}`;

    const s = filenames.map(n=> `<img alt="screenshot" src=${n}>`).join('\n  ');
    html = html.replace(/XXX/g, s);

    const filename = screenshotFileName+'.html';
    const blob = new Blob([html], { type: 'text/html' });
    return await writeBlobToFile(blob, filename);
  }



  function setProgressbarVisible(b) {
    progressbar.value = 0;
    if (b) {
      progressbar.classList.remove('hidden');
    } else {
      progressbar.classList.add('hidden');
    }
  }


  function onProgress(f) {
    if (f >= 1) {
      divText.innerText = `Capturing... done`;
    } else {
      progressbar.value = f * 100;
      const n = progressNumberFormat.format(f * 100);
      divText.innerText = `Capturing... ${n}% `;
    }
  }


  function onError(err) {
    divText.innerHTML = `<span class="ge-error-color">${err}</span>`;
    document.querySelector(".do-capture-btn").disabled = false;
  }


  function onCompleted(filenames, index) {
    document.querySelector(".do-capture-btn").disabled = false;
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

