function cleanPage(para) {
  try {
    return chrome.scripting.executeScript({
      target: {
        tabId: currentTab.id},
        func: fnClean,
        args: [para]

    });
  } catch (err) {
    console.error(`failed to execute script: ${err}`);
  }
}

const fnClean = (para) => {
  console.log(JSON.stringify(para, null, 4));
  document.querySelectorAll('img').forEach(ele=>ele.remove());
  document.querySelectorAll('iframe').forEach(ele=>ele.remove());
};