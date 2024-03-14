const btnRuler = document.querySelector(".ruler-btn");

let rulerVisible = false;

btnRuler.addEventListener("click", toogleRulerVisibility);

chrome.tabs.sendMessage(currentTab.id, "requestRulerInfo").then((visible)=>{
  console.log('rulerVisible visible', visible);
  rulerVisible = visible;
  syncRulerIcon(visible);
});

/**
 * Toggles the visibility of the ruler.
 *
 * @return {undefined}
 */
function toogleRulerVisibility() {
  rulerVisible = !rulerVisible;
  showRuler(rulerVisible);
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
 *
 * @return {undefined}
 */
function showRuler(show) {
  syncRulerIcon(show);

  try {
    if (show) {
      setLabelText('Ruler added.');
      showDiv(divDummy);

      chrome.scripting.executeScript({
        target: {tabId: currentTab.id},
        files: ['js/inject/ruler.js'],
      }).then(() => {
        chrome.tabs.sendMessage(currentTab.id, {type: 'ENABLE', value: true});
      })

    } else {
      setLabelText('');
      showDiv(divDummy);
      chrome.tabs.sendMessage(currentTab.id, {type: 'ENABLE', value: false});
    }
  } catch (err){
    console.error(err);
  }
}