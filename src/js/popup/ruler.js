

let rulerVisible = false;


/**
 * Initializes the ruler for a specific tab.
 *
 * @param {number} tabId - The ID of the tab to initialize the ruler for.
 * @return {Promise} - A promise that resolves when the ruler is initialized.
 */
export function initRuler(tabId) {
  chrome.tabs.sendMessage(tabId, "requestRulerInfo").then((visible) => {
    rulerVisible = visible;
    syncRulerIcon(visible);
  });
}

/**
 * Toggles the visibility of the ruler.
 *
 * @return {undefined}
 */
export function toogleRulerVisibility(tabId) {
  rulerVisible = !rulerVisible;
  showRuler(rulerVisible, tabId);
  return rulerVisible;
}

/**
 * Synchronizes the visibility of the ruler icon.
 *
 * @param {boolean} rulerVisible - Determines whether the ruler icon should be visible or hidden.
 * @return {void}
 */
function syncRulerIcon(rulerVisible) {
  if (rulerVisible){
    document.querySelector('.rule-hidden-stroke-path').classList.remove('hidden');
  } else {
    document.querySelector('.rule-hidden-stroke-path').classList.add('hidden');
  }
}

/**
 * Enables or disables the display of a ruler.
 *
 * @param {boolean} show - A boolean value indicating whether to show the ruler or not.
 * @param tabId
 *
 * @return {undefined}
 */
function showRuler(show, tabId) {
  syncRulerIcon(show);

  try {
    if (show) {
      chrome.scripting.executeScript({
        target: {tabId},
        files: [
          'js/inject/ruler.js'
        ],
      }).then(() => {
        chrome.tabs.sendMessage(tabId, {type: 'ENABLE', value: true});
      })

    } else {
      chrome.tabs.sendMessage(tabId, {type: 'ENABLE', value: false});
    }
  } catch (err){
    console.error(err);
  }
}