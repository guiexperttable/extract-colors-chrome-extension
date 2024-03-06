/**
 * Toggles the design mode of the document.
 *
 * @returns {string} The new design mode value.
 */
async function toggleDesignMode(){
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    return chrome.scripting.executeScript({
      target: {tabId: tab.id},
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
