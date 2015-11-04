var form = document.querySelector('#github_assignments_options');
var addEl = document.querySelector('.add-token');
var removeEl = document.querySelector('.remove-token');
var formAccount = document.querySelector('#github_account_info');
var orgInput = document.querySelector('.org');
var userInput = document.querySelector('.username');

function addToken(event) {
  event.preventDefault();
  var token = document.querySelector('.token').value;
  chrome.storage.sync.set({'token': token}, function() {
    hasToken(true);
  });
}

function removeToken(event) {
  event.preventDefault();
  chrome.storage.sync.set({'token': null}, function() {
    hasToken(false);
  });
}

function hasToken(has) {
  if (has) {
    form.addEventListener('submit', removeToken);
    form.removeEventListener('submit', addToken);
    addEl.style.display = 'none';
    removeEl.style.display = 'initial';
  }
  else {
    form.addEventListener('submit', addToken);
    form.removeEventListener('submit', removeToken);
    removeEl.style.display = 'none';
    addEl.style.display = 'initial';
  }
}

function updateAccountSettings(event) {
  event.preventDefault();
  var org = orgInput.value;
  var user = userInput.value;

  chrome.storage.sync.set({'org': org, 'user': user}, function() {
    alert('Account Settings Saved!');
  });
}

function setUpAccountSettings(items) {
  if (items.org) { orgInput.value = items.org }
  if (items.user) { userInput.value = items.user }

  formAccount.addEventListener('submit', updateAccountSettings);
}

chrome.storage.sync.get(['token', 'org', 'user'], function(items) {
  console.log(items);
  hasToken(!!items.token);
  setUpAccountSettings(items);
});
