export function cleanPage(tabId) {
  try {
    return chrome.scripting.executeScript({
      target: {
        tabId
      },
      func: fnClean
    })
    .then((res) => {
      return res[0].result;
    });

  } catch (err) {
    console.error(`failed to execute script: ${err}`);
  }
  return 0;
}



/**
 * Cleans the webpage by removing unwanted advertisements and iframes.
 *
 * @async
 * @function fnClean
 * @returns {Promise<number>} - The count of removed advertisements and iframes.
 */
const fnClean = async () => {
  const advertisingClasses = [
    '[class^="ad-"], [class^="-ad"], [class*="-ad-"], [class*="advertisement"], [class^="promo-"], [class*="StickyFooter"]',
    '#ad', '.ad', '.sponsor', '.sponsored', '.promo', '.promoted', '.promotion', '.banner',  '.supplementary',
    'video, iframe'
  ];

  async function wait(ms) {
    return new Promise((resolve, _reject) => setTimeout(resolve, ms));
  }

  function r(ele){
    ele.remove();
    count++;
  }

  let count = 0;
  window.scrollTo(0, 99999);
  await wait(1000);
  advertisingClasses.forEach(sel => document.querySelectorAll(sel).forEach(r));

  window.scrollTo(0, 0);
  await wait(1000);
  advertisingClasses.forEach(sel => document.querySelectorAll(sel).forEach(r));

  return count;
};