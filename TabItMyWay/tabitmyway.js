"use strict";

// local object for storage of tab history et al.
var currentlyActiveTabs = {};
var useOpenerTabId = true;
var openNewNextToCurrent = true;
var useTabHistory = true;
browser.storage.local.get([ "useOpenerTabId", "openNewNextToCurrent", "useTabHistory", "tabHistorySize" ]).then(
  (item) => {
    currentlyActiveTabs.historySize = 32;
    if (item.tabHistorySize)
      currentlyActiveTabs.historySize = item.tabHistorySize;
    useOpenerTabId = item.useOpenerTabId;
    openNewNextToCurrent = item.openNewNextToCurrent;
    useTabHistory = item.useTabHistory;
  }
);

// moves tabToMove behind targetTab
function moveTabBehind(tabToMove, targetTab) {
  browser.tabs.move([tabToMove.id], {index: (targetTab.index+1)});
}

// every time the active tab has changed we need to update the history
// we do this on a per-window basis
browser.tabs.onActivated.addListener(
  (activeInfo) => {
    if (!currentlyActiveTabs[activeInfo.windowId]) {
      currentlyActiveTabs[activeInfo.windowId] = {};
      currentlyActiveTabs[activeInfo.windowId].history = [];
    }
    currentlyActiveTabs[activeInfo.windowId].history.unshift(activeInfo.tabId);
    if (currentlyActiveTabs[activeInfo.windowId].history.length > currentlyActiveTabs.historySize) {
      currentlyActiveTabs[activeInfo.windowId].history.pop();
    }

    //console.log("Activated Tab: " + activeInfo.tabId);
    //console.log("history now:");
    //console.log(currentlyActiveTabs[activeInfo.windowId].history);
  }
);

// sort the newly created tab to the correct location
browser.tabs.onCreated.addListener(
  (newTab) => {
    if (useOpenerTabId && newTab.openerTabId) {
      console.log(`Using opener ID: ${newTab.openerTabId}`);
      browser.tabs.get(newTab.openerTabId).then(
        (targetTab) => {
          moveTabBehind(newTab, targetTab);
        }
      );
    }
    else if (openNewNextToCurrent) {
      console.log("Using currentlyActiveTabs: " + currentlyActiveTabs[newTab.windowId].activeId);
      browser.tabs.get(currentlyActiveTabs[newTab.windowId].history[0]).then(
        (targetTab) => {
          moveTabBehind(newTab, targetTab);
        }
      );
    }
});

// when closing a tab go back to the previously active tab
browser.tabs.onRemoved.addListener(
  (tabId, removeInfo) => {
    if (useTabHistory && !removeInfo.isWindowClosing) {
      let wid = removeInfo.windowId;
      //console.log("Removed Tab: " + tabId);
      //console.log("history now:");
      //console.log(currentlyActiveTabs[wid].history);

      if ((currentlyActiveTabs[wid].history.length >= 2) && (tabId == currentlyActiveTabs[wid].history[0])) {
        //console.log("Restoring: " + currentlyActiveTabs[wid].history[1])
        browser.tabs.update(currentlyActiveTabs[wid].history[1], {
            active: true
        }).then(
          () => {
            //console.log("cleaning history from:");
            //console.log(currentlyActiveTabs[wid].history);

            // In the proecss Firefox usually (but not always) changed the active tab twice
            // We don't want to have this in our history so we clean up
            for (var i = 1; i < currentlyActiveTabs[wid].history.length; ++i) {
              if (currentlyActiveTabs[wid].history[i] == tabId) {
                currentlyActiveTabs[wid].history.splice(0, i+1);
              }
            }
            // Also remove all occurences of the closed tab from the history
            currentlyActiveTabs[wid].history = currentlyActiveTabs[wid].history.filter(
              (historyTabId) => { return historyTabId != tabId; }
            );

            //console.log("..to:");
            //console.log(currentlyActiveTabs[wid].history);
          }
        );
      }
    }
  }
)
