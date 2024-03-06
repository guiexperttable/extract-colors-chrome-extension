
chrome.runtime.onMessage.addListener( (message, sender, sendResponse) => {
  console.log('Nachricht vom Popup erhalten:', message);
  sendResponse('F.A.B.!');
});