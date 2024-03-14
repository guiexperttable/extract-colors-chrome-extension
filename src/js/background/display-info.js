chrome.runtime.onMessage
  .addListener((message, _sender, sendResponse) => {

    if (message === "requestDisplayInfo") {
      chrome.system.display
        .getInfo()
        .then(res => {
          chrome.runtime.sendMessage({displayInfo: res}, () => {});
        });
      sendResponse(true);
    }
  });