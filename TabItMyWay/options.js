function saveOptions(e) {
  e.preventDefault();
  browser.storage.local.set({
    useOpenerTabId: document.querySelector("#useOpenerTabId").checked,
    openNewNextToCurrent: document.querySelector("#openNewNextToCurrent").checked,
    useTabHistory: document.querySelector("#useTabHistory").checked,
    tabHistorySize: document.querySelector("#tabHistorySize").value
  });
}

function restoreOptions() {
  function setCurrentChoice(result) {
    document.querySelector("#useOpenerTabId").checked = result.useOpenerTabId;
    document.querySelector("#openNewNextToCurrent").checked = result.openNewNextToCurrent;
    document.querySelector("#useTabHistory").checked = result.useTabHistory;
    document.querySelector("#tabHistorySize").value = result.tabHistorySize;
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  var getting = browser.storage.local.get([ "useOpenerTabId", "openNewNextToCurrent", "useTabHistory", "tabHistorySize" ]);
  getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
