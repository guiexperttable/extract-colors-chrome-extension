

chrome.runtime.onMessage
  .addListener((message, _sender, sendResponse) => {

    let b = !!window['rulerLoaded'];
    if (message === "requestRulerInfo") {
      console.log('injected: requestRulerInfo:', b);
      sendResponse(b);
      return true;

    // } else if (message === "requestRulerInfo") {
    //   sendResponse(b);
    //   return true;
    }
});