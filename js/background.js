let GLOBAL_CONFIG = {
  aiUrl: '',
  apiKey: '',
  targetLanguage: ''
};

async function loadConfig() {
  return new Promise(resolve => {
    chrome.storage.local.get(['aiUrl', 'apiKey','targetLanguage','model'], items => {
      GLOBAL_CONFIG.aiUrl = items.aiUrl || '';
      GLOBAL_CONFIG.apiKey = items.apiKey || '';
      GLOBAL_CONFIG.targetLanguage = items.targetLanguage || '';
      GLOBAL_CONFIG.model = items.model || '';
      console.log('Config Loaded:', GLOBAL_CONFIG);
      resolve(GLOBAL_CONFIG);
    });
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  let changed = false;
  if (changes.aiUrl) {
    GLOBAL_CONFIG.aiUrl = changes.aiUrl.newValue || '';
    changed = true;
  }
  if (changes.apiKey) {
    GLOBAL_CONFIG.apiKey = changes.apiKey.newValue || '';
    changed = true;
  }

  if (changed) {
    console.log('Config Updated:', GLOBAL_CONFIG);
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'CONFIG_UPDATED',
          config: GLOBAL_CONFIG
        });
      });
    });
  }
});

loadConfig();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch(msg.type){
    case 'CALL_AI':
      (async () => {
        try {
          const result = await AIClient.request(msg.data);
          sendResponse({ success: true, data: result });
        } catch (error) {
          sendResponse({
            success: false,
            error: error.message,
            code: error.code || 500
          });
        }
      })();
      return true;
      break;
    case 'GET_CONFIG':
      sendResponse({ success: true, data:GLOBAL_CONFIG});
      break;
  }
});
class AIClient {
  static async request(payload, options = {}) {
    const { retry = 3, timeout = 500000 } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${GLOBAL_CONFIG.aiUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GLOBAL_CONFIG.apiKey}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ERROR ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (retry > 0) {
        return this.request(`${GLOBAL_CONFIG.aiUrl}`, payload, { ...options, retry: retry - 1 });
      }
      throw new Error(`AI Request Failed: ${error.message}`);
    }
  }
}
