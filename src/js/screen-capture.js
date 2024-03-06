async function captureScreen() {
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    return chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: capture

    })
      .then((res) => {
        if (res) {
          if (res.error) {
            console.error(res.error);
            return res.error;
          }
          return res[0].result;
        }
        return 'Error';
      })
  } catch (err) {
    console.error(`failed to execute script: ${err}`);
  }
}

const capture = async () => {

  const pauseAfterScrolling = 500;
  const canvasWidth = document.body.clientWidth;
  const viewportHeight = window.innerHeight;
  const canvasHeight = document.body.scrollHeight;

  const htmlEle = document.documentElement;
  const scrollBehavior = htmlEle.style.scrollBehavior;
  const overflow = htmlEle.style.overflow;

  function injectCursorNoneStyle() {
    const poopClowns = ":not(#💩🤡)".repeat(20);
    const cssRules = `${poopClowns} {cursor: none !important}`;
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-todo', 'remove');
    styleElement.appendChild(document.createTextNode(cssRules));
    document.head.appendChild(styleElement);
  }

  function removeCursorNoneStyle(){
    document
      .querySelectorAll('style[data-todo="remove"]')
      .forEach(ele=>ele.remove());
  }

  function tweakScrollStyle() {
    htmlEle.style.scrollBehavior = 'auto'; // Quick, not smooth
    htmlEle.style.overflow = 'hidden'; // Disable all scrollbars
  }

  function restoreScrollStyle() {
    htmlEle.style.overflow = overflow;
    htmlEle.style.scrollBehavior = scrollBehavior;
  }

  function scroll(y) {
    return new Promise((resolve, _reject) => {
      window.scrollTo(0, y);
      setTimeout(()=>{
        resolve();
      }, pauseAfterScrolling);
    });
  }

  async function go() {
    // Tweak style for capturing:
    injectCursorNoneStyle();
    tweakScrollStyle();

    let y = 0;
    window.scrollTo(0, 0);
    while (y < canvasHeight) {
      y += viewportHeight;
      console.log('y', y)
      await scroll(y);
    }
    window.scrollTo(0, 0);

    // Restore style:
    restoreScrollStyle();
    removeCursorNoneStyle();
  }


  await go();
  let ret = {
    canvasWidth, viewportHeight, canvasHeight
  };
  console.log(ret);
  return ret;
};



/*
  chrome.tabs.captureVisibleTab(null, {format: "png"}, function(dataUrl) {
    var img = new Image();
    img.src = dataUrl;
    img.onload = function() {
      var canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = document.body.scrollHeight;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, img.width, img.height);
      // return new Promise((resolve, reject) => {
      //   chrome.tabs.executeScript(null, {code: "window.scrollTo(0, document.body.scrollHeight)"}, function() {
      //     setTimeout(function() {
      //       chrome.tabs.captureVisibleTab(null, {format: "png"}, function(dataUrl) {
      //         var img2 = new Image();
      //         img2.src = dataUrl;
      //         img2.onload = function() {
      //
      // }})})})})
      // chrome.tabs.executeScript(null, {code: "window.scrollTo(0, document.body.scrollHeight)"}, function() {
      //   setTimeout(function() {
          chrome.tabs.captureVisibleTab(null, {format: "png"}, function(dataUrl) {
            var img2 = new Image();
            img2.src = dataUrl;
            img2.onload = function() {
              ctx.drawImage(img2, 0, img.height, img2.width, img2.height);
              var finalDataUrl = canvas.toDataURL("image/png");
              // Use finalDataUrl as needed
            }
          });
        }, 500);
      });
    }
  });


  return {
    captureToBlobs: captureToBlobs
  };
*/



/*


async function captureScreen() {
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  return chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: ()=> new Date()

  }).then((res) => {
    return res[0].result;
  });
}

const capture = async () => {
  const pauseAfterScrolling = 500;
  const canvasWidth = document.body.clientWidth;
  const viewportHeight = document.body.clientHeight;
  const canvasHeight = document.body.scrollHeight;
  const htmlEle = document.documentElement;

  // const canvas = document.createElement("canvas");
  // canvas.width = canvasWidth;
  // canvas.height = canvasHeight;
  // const ctx = canvas.getContext("2d");


  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

  function scroll(y) {
    return new Promise((resolve, _reject) => {
      window.scrollTo(0, y);
        setTimeout(()=>{
          resolve();
        }, pauseAfterScrolling);
    });
  }



  function makePhoto() {
    return new Promise((resolve, reject) => {

      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: () => {
          chrome.tabs.captureVisibleTab(
            null, {format: 'png'}, (dataURI) => {
              if (dataURI) {
                const image = new Image();
                image.onload = function () {
                  data.image = {width: image.width, height: image.height};

                  // given device mode emulation or zooming, we may end up with
                  // a different sized image than expected, so let's adjust to
                  // match it!
                  if (data.windowWidth !== image.width) {
                    const scale = image.width / data.windowWidth;
                    data.x *= scale;
                    data.y *= scale;
                    data.totalWidth *= scale;
                    data.totalHeight *= scale;
                  }
                }
                resolve(data);
              } else {
                reject();
              }
            });
        }

      // }).then((res) => {
      //   return res[0].result;
      });
    });
  }

  let y = 0;
  // const scrollBehavior = htmlEle.style.scrollBehavior;
  // const overflow = htmlEle.style.overflow;
  // htmlEle.style.scrollBehavior = 'auto'; // Quick, not smooth
  // htmlEle.style.overflow = 'hidden'; // Disable all scrollbars

  // window.scrollTo(0, 0);
  while (y < canvasHeight) {
    y += viewportHeight;
    console.log('y', y)
    // const data = await makePhoto();
    // console.log(data);
    // await scroll(y);
  }
  // window.scrollTo(0, 0);
  // Set style to old values:
  // htmlEle.style.overflow = overflow;
  // htmlEle.style.scrollBehavior = scrollBehavior;

  let ret = {
    canvasWidth, viewportHeight, canvasHeight
  };
  console.log(ret);
  return ret;
  /*
    chrome.tabs.captureVisibleTab(null, {format: "png"}, function(dataUrl) {
      var img = new Image();
      img.src = dataUrl;
      img.onload = function() {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = document.body.scrollHeight;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, img.width, img.height);
        // return new Promise((resolve, reject) => {
        //   chrome.tabs.executeScript(null, {code: "window.scrollTo(0, document.body.scrollHeight)"}, function() {
        //     setTimeout(function() {
        //       chrome.tabs.captureVisibleTab(null, {format: "png"}, function(dataUrl) {
        //         var img2 = new Image();
        //         img2.src = dataUrl;
        //         img2.onload = function() {
        //
        // }})})})})
        // chrome.tabs.executeScript(null, {code: "window.scrollTo(0, document.body.scrollHeight)"}, function() {
        //   setTimeout(function() {
            chrome.tabs.captureVisibleTab(null, {format: "png"}, function(dataUrl) {
              var img2 = new Image();
              img2.src = dataUrl;
              img2.onload = function() {
                ctx.drawImage(img2, 0, img.height, img2.width, img2.height);
                var finalDataUrl = canvas.toDataURL("image/png");
                // Use finalDataUrl as needed
              }
            });
          }, 500);
        });
      }
    });


    return {
      captureToBlobs: captureToBlobs
    };

};

async function captureScreen() {
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  return chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: capture

  }).then((res) => {
    return res[0].result;
  });
}

const capture = async () => {
  const pauseAfterScrolling = 500;
  const canvasWidth = document.body.clientWidth;
  const viewportHeight = document.body.clientHeight;
  const canvasHeight = document.body.scrollHeight;
  const htmlEle = document.documentElement;

  // let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  function scroll(y) {
    return new Promise((resolve, _reject) => {
      window.scrollTo(0, y);
        setTimeout(()=>{
          resolve();
        }, pauseAfterScrolling);
    });
  }

  let y = 0;
  const scrollBehavior = htmlEle.style.scrollBehavior;
  htmlEle.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  while (y < canvasHeight) {
    y += viewportHeight;
    console.log('y', y)
    await scroll(y);
  }
  window.scrollTo(0, 0);
  htmlEle.style.scrollBehavior = scrollBehavior;

  let ret = {
    canvasWidth, viewportHeight, canvasHeight
  };
  console.log(ret);
  return ret;
  /*
    chrome.tabs.captureVisibleTab(null, {format: "png"}, function(dataUrl) {
      var img = new Image();
      img.src = dataUrl;
      img.onload = function() {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = document.body.scrollHeight;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, img.width, img.height);
        // return new Promise((resolve, reject) => {
        //   chrome.tabs.executeScript(null, {code: "window.scrollTo(0, document.body.scrollHeight)"}, function() {
        //     setTimeout(function() {
        //       chrome.tabs.captureVisibleTab(null, {format: "png"}, function(dataUrl) {
        //         var img2 = new Image();
        //         img2.src = dataUrl;
        //         img2.onload = function() {
        //
        // }})})})})
        // chrome.tabs.executeScript(null, {code: "window.scrollTo(0, document.body.scrollHeight)"}, function() {
        //   setTimeout(function() {
            chrome.tabs.captureVisibleTab(null, {format: "png"}, function(dataUrl) {
              var img2 = new Image();
              img2.src = dataUrl;
              img2.onload = function() {
                ctx.drawImage(img2, 0, img.height, img2.width, img2.height);
                var finalDataUrl = canvas.toDataURL("image/png");
                // Use finalDataUrl as needed
              }
            });
          }, 500);
        });
      }
    });


    return {
      captureToBlobs: captureToBlobs
    };

};
 */
