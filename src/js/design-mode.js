/**
 * Toggles the design mode of the document.
 *
 * @returns {string} The new design mode value.
 */
async function toggleDesignMode(){
  try {
    return chrome.scripting.executeScript({
      target: {tabId: currentTab.id},
      func: ()=> {
        const value = document.designMode === 'on' ? 'off': 'on';
        document.designMode = value;
        return value;
      }

    }).then((res) => {
      return res[0].result;
    });
  } catch (err) {
    console.error(`failed to execute script: ${err}`);
  }
}
