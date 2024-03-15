/**
 * Toggles the design mode of the document.
 *
 * @returns {string} The new design mode value.
 */
export async function toggleDesignMode(tabId){
  try {
    return chrome.scripting.executeScript({
      target: {tabId: tabId},
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
