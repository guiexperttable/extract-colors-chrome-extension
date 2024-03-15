

chrome.runtime.onMessage
  .addListener((message, _sender, sendResponse) => {

    let b = !!window['rulerLoaded'];
    if (message === "requestRulerInfo") {
      sendResponse(b);
      return true;
    }
});