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
  */
};