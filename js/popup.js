const $ = id => document.getElementById(id);
const status = $('status');


function save(){
  const config = {
    aiUrl: $('url').value.trim(),
    model: $('model').value.trim(),
    apiKey: $('apikey').value.trim(),
    targetLanguage: $('targetLanguage').value.trim()
  };

  chrome.storage.local.set(config, () => {
    setTimeout(() => status.textContent = '', 2000);

    chrome.runtime.sendMessage({type: 'CONFIG_SAVED'});
  });
}
$('save').onclick = () => {save();status.textContent = 'Config Saved';};

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['aiUrl', 'apiKey', 'targetLanguage','model'], items => {
    $('url').value = items.aiUrl || '';
    $('model').value = items.model || '';
    $('apikey').value = items.apiKey || '';
    $('targetLanguage').value = items.targetLanguage || '';
  });
});
const autoSave = setInterval(save, 500);
window.addEventListener('unload', () => {
    clearInterval(autoSave);
});
