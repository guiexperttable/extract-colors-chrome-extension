function cleanPage() {
  try {
    return chrome.scripting.executeScript({
      target: {
        tabId: currentTab.id
      },
      func: fnClean
    })
    .then((res) => {
      console.log(res)
      return res[0].result;
    });

  } catch (err) {
    console.error(`failed to execute script: ${err}`);
  }
  return 0;
}



const fnClean = async () => {
  const advertisingClasses = ['ad', 'advertisement', 'ad-container', 'ad-banner', 'ad-wrapper', 'ad-slot', 'ad-box', 'ad-frame', 'ad-block', 'ad-unit', 'ad-placeholder', 'ad-label', 'ad-overlay', 'ad-link', 'sponsor', 'sponsored', 'promo', 'promoted', 'promotion', 'promo-box', 'promo-container', 'promo-banner', 'promo-unit', 'promo-label', 'promo-ad', 'promo-link', 'banner', 'banner-ad', 'banner-advertisement', 'banner-ad-container', 'banner-ad-slot', 'banner-ad-wrapper', 'banner-ad-block', 'banner-ad-unit', 'banner-ad-placeholder', 'banner-ad-label', 'banner-ad-overlay', 'banner-ad-link', 'sidebar-ad', 'sidebar-advertisement', 'sidebar-ad-container', 'sidebar-ad-slot', 'sidebar-ad-wrapper', 'sidebar-ad-block', 'sidebar-ad-unit', 'sidebar-ad-placeholder', 'sidebar-ad-label', 'sidebar-ad-overlay', 'sidebar-ad-link', 'inline-ad', 'inline-advertisement', 'inline-ad-container', 'inline-ad-slot', 'inline-ad-wrapper', 'inline-ad-block', 'inline-ad-unit', 'inline-ad-placeholder', 'inline-ad-label', 'inline-ad-overlay', 'inline-ad-link', 'popup-ad', 'popup-advertisement', 'popup-ad-container', 'popup-ad-slot', 'popup-ad-wrapper', 'popup-ad-block', 'popup-ad-unit', 'popup-ad-placeholder', 'popup-ad-label', 'popup-ad-overlay', 'popup-ad-link', 'overlay-ad', 'overlay-advertisement', 'overlay-ad-container', 'overlay-ad-slot', 'overlay-ad-wrapper', 'overlay-ad-block', 'overlay-ad-unit', 'overlay-ad-placeholder', 'overlay-ad-label', 'overlay-ad-overlay', 'overlay-ad-link', 'top-ad', 'bottom-ad', 'left-ad', 'right-ad', 'fullwidth-ad', 'halfpage-ad', 'leaderboard-ad', 'skyscraper-ad', 'rectangle-ad', 'square-ad', 'button-ad', 'mobile-ad', 'tablet-ad', 'desktop-ad', 'responsive-ad', 'sticky-ad', 'video-ad', 'audio-ad', 'display-ad', 'text-ad', 'image-ad', 'richmedia-ad', 'expandable-ad', 'interstitial-ad', 'native-ad', 'contextual-ad', 'context-ad', 'contextual-advertisement', 'context-ad-container', 'context-ad-slot', 'context-ad-wrapper', 'context-ad-block', 'context-ad-unit', 'context-ad-placeholder', 'context-ad-label', 'context-ad-overlay', 'context-ad-link'];

  async function wait(ms) {
    return new Promise((resolve, _reject) => setTimeout(resolve, ms));
  }

  window.scrollTo(0, 99999);
  await wait(1000);
  window.scrollTo(0, 0);
  await wait(1000);

  let count = 0;
  document.querySelectorAll('iframe')
    .forEach(ele => {
      ele.remove();
      count++;
    });
  for (const advertisingClass of advertisingClasses) {
    document
      .querySelectorAll('div.' + advertisingClass)
      .forEach(ele => {
        ele.remove();
        count++;
      });
  }
  console.log('count', count)
  return count;
};