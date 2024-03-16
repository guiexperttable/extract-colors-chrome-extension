

export const windowSizes = [
  { "width": 320, "height": 480, "label": "HVGA" },
  { "width": 480, "height": 800, "label": "WVGA" },
  { "width": 768, "height": 1024, "label": "XGA" },
  { "width": 1024, "height": 768, "label": "XGA" },
  { "width": 1080, "height": 1920, "label": "FHD (1080p)" },
  { "width": 1200, "height": 1920, "label": "WUXGA" },
  { "width": 1280, "height": 800, "label": "13,3\" Wide" },
  { "width": 1366, "height": 768, "label": "HD" },
  { "width": 1440, "height": 900, "label": "WXGA" },
  { "width": 1440, "height": 900, "label": "WXGA" },
  { "width": 1680, "height": 1050, "label": "WSXGA" },
  { "width": 1600, "height": 900, "label": "HD+" },
  { "width": 1920, "height": 1080, "label": "FHD (1080p)" },
  { "width": 1920, "height": 1200, "label": "WUXGA" },
  { "width": 2560, "height": 1440, "label": "QHD (1440p)" },
  { "width": 2560, "height": 1600, "label": "WQXGA" },
  { "width": 2880, "height": 1800, "label": "QHD+" },
  { "width": 3840, "height": 2160, "label": "UHD (4K)" },
  { "width": 4096, "height": 2160, "label": "4K DCI" },
  { "width": 5120, "height": 2880, "label": "5K" },
  { "width": 7680, "height": 4320, "label": "8K UHD" },
  { "width": 10240, "height": 4320, "label": "10K" }
];

// https://developer.chrome.com/docs/extensions/reference/api/windows?hl=de#method-update
export function updateWindow(winId, config) {
  return new Promise((resolve, reject) => {
    chrome.windows.update(winId, config, win => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(win);
    });
  });
}