const $ = id => document.getElementById(id);
const status = $('status');
const button = $('save');
const getValue = name => $(name).value;

import {Varables} from './background.js'
console.log(Varables);
function save(){
  let config = {};
  Varables.forEach((key) => {config[key]=getValue(key)});
  chrome.storage.local.set(config, () => {
    chrome.runtime.sendMessage({type: 'CONFIG_SAVED'});
  });
}
button.onclick = () => {
  save();
  status.textContent = 'Config Saved';
  setTimeout(() => status.textContent = '', 2000);
};

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(Varables, items => {
    Varables.forEach((key) => {$(key).value=items[key] || ''});
  });
});
const autoSave = setInterval(save, 1000);
window.addEventListener('unload', () => {
    clearInterval(autoSave);
});
