import * as types from './utils/action-types';
import refreshUserInfo from './utils/identity';
import { getSanitizedUrl } from './utils/urls';
import { removeScriptTags } from './utils/base';
import { defaultColor } from './utils/color';

global.browser = require('webextension-polyfill');

const getNotes = (tab, actionType) => {
  refreshUserInfo().then(user => {
    const url = getSanitizedUrl(tab.url);

    // TODO: query notes by current url
    // then send back to tab
    // chrome.tabs.sendMessage(tab.id, { action: actionType, data: notes }, response => {
    //   console.log(response);
    // });
  });
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    title: 'Annotate in WebNote',
    id: types.WEB_NOTE_RIGHT_CLICK_MENU_ID,
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === types.WEB_NOTE_RIGHT_CLICK_MENU_ID) {
    console.log('right click triggered');
    chrome.tabs.sendMessage(tab.id, { action: types.RIGHT_CLICK }, response => {
      console.log(response);
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.toLowerCase().startsWith('http')) {
    getNotes(tab, types.HIGHLIGHT_ALL);
  }
});

chrome.browserAction.onClicked.addListener(tab => {
  getNotes(tab, types.SHOW_SIDE_BAR);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  refreshUserInfo()
    .then(user => {
      // simple filter for remove script tags
      if (request && request.note) {
        request.note = removeScriptTags(request.note);
      }

      if (request.action === types.ADD_NOTE) {
        const pa = request.pageAnnotation;
        const pageAnnotation = {
          text: pa.text,
          note: pa.note,
          highlightColor: pa.highlightColor || defaultColor,
          isCustom: pa.isCustom || false,
          url: getSanitizedUrl(sender.tab.url),
          timestamp: new Date().getTime(),
        };
        // TODO: save note
      }
      if (request.action === types.DELETE_NOTE) {
        // TODO: delete note
      }
      if (request.action === types.UPDATE_NOTE) {
        if (!request.pageAnnotation.id) return;
        note = {
          note: removeScriptTags(request.pageAnnotation.note || ''),
          highlightColor: request.pageAnnotation.highlightColor || defaultColor,
          timestamp: new Date().getTime(),
        };
        // TODO: UPDATE note
      }
    })
    .then(() => sendResponse({ done: 'true' }));
  return true;
});

chrome.commands.onCommand.addListener(command => {
  if (command === types.CMD_HIGHLIGHT_TOGGLE) {
    console.log(types.CMD_HIGHLIGHT_TOGGLE);
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, { action: types.CMD_HIGHLIGHT_TOGGLE }, response => {
        console.log(response);
      });
    });
  } else if (command === types.CMD_OPEN_OPTIONS_PAGE) {
    chrome.runtime.openOptionsPage(() => console.log('Options page is opened'));
  }
});