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



