

// https://developer.chrome.com/docs/extensions/reference/api/windows?hl=de#method-update
function updateWindow(winId, config) {
  return new Promise((resolve, reject) => {
    chrome.windows.update(winId, config, win => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(win);
    });
  });
}