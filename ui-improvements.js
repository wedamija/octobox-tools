// ==UserScript==
// @name         Octobox Resizable Thread Pane
// @namespace    https://octobox.io
// @version      3.2
// @description  Always-visible resizable thread pane, persists selection across refresh
// @match        https://octobox.io/*
// @match        http://localhost:3000/*
// @grant        GM_addStyle
// @updateURL    https://cdn.jsdelivr.net/gh/wedamija/octobox-tools@main/ui-improvements.js
// @downloadURL  https://cdn.jsdelivr.net/gh/wedamija/octobox-tools@main/ui-improvements.js
// ==/UserScript==

(function () {
  'use strict';

  var STORAGE_KEY = 'octobox-thread-width';
  var SELECTED_KEY = 'octobox-selected-notification';
  var MIN_WIDTH = 200;
  var DEFAULT_WIDTH = 500;
  var savedWidth = parseInt(localStorage.getItem(STORAGE_KEY), 10) || DEFAULT_WIDTH;

  GM_addStyle(
    '.ob-handle { width: 6px; flex-shrink: 0; cursor: col-resize; background: transparent; position: relative; z-index: 10; transition: background 0.15s; }' +
    '.ob-handle:hover, .ob-handle.ob-dragging { background: #0366d6; }' +
    'tr.notification { cursor: pointer; }'
  );

  function applySize() {
    var thread = document.querySelector('.flex-thread');
    if (!thread) return;

    thread.style.flex = '0 0 ' + savedWidth + 'px';
    thread.style.width = savedWidth + 'px';
    thread.style.maxWidth = '70vw';

    ensureHandle();
  }

  function ensureHandle() {
    var content = document.querySelector('.flex-content');
    var thread = document.querySelector('.flex-thread');
    if (!content || !thread) return;

    var handle = content.querySelector(':scope > .ob-handle');

    if (handle && handle.nextElementSibling !== thread) {
      handle.remove();
      handle = null;
    }

    if (!handle) {
      handle = document.createElement('div');
      handle.className = 'ob-handle';
      content.insertBefore(handle, thread);
      bindDrag(handle, content);
    }
  }

  function bindDrag(handle, content) {
    var dragging = false;

    handle.addEventListener('mousedown', function (e) {
      e.preventDefault();
      dragging = true;
      handle.classList.add('ob-dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var thread = document.querySelector('.flex-thread');
      if (!thread) return;
      var contentRect = content.getBoundingClientRect();
      var w = Math.max(MIN_WIDTH, Math.min(contentRect.right - e.clientX, contentRect.width * 0.7));
      savedWidth = w;
      thread.style.flex = '0 0 ' + w + 'px';
      thread.style.width = w + 'px';
    });

    document.addEventListener('mouseup', function () {
      if (!dragging) return;
      dragging = false;
      handle.classList.remove('ob-dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem(STORAGE_KEY, Math.round(savedWidth));
    });
  }

  document.addEventListener('click', function (e) {
    var row = e.target.closest('tr.notification');
    if (!row) return;
    if (e.target.closest('.custom-control-input, .toggle-star, label[for]')) return;

    var link = row.querySelector('a.link');
    if (!link) return;

    var notificationId = row.id.replace('notification-', '');
    sessionStorage.setItem(SELECTED_KEY, notificationId);

    if (!e.target.closest('a, button')) {
      link.click();
    }
  });

  function restoreSelection() {
    var savedId = sessionStorage.getItem(SELECTED_KEY);
    if (!savedId) return;

    var row = document.getElementById('notification-' + savedId);
    if (!row) {
      sessionStorage.removeItem(SELECTED_KEY);
      return;
    }

    var link = row.querySelector('a.link.thread-link');
    if (link) link.click();
  }

  function init() {
    applySize();
    restoreSelection();
  }

  document.addEventListener('turbolinks:load', init);

  new MutationObserver(function () {
    if (!document.querySelector('.ob-handle') && document.querySelector('.flex-thread')) {
      init();
    }
  }).observe(document, { childList: true, subtree: true });

  init();
})();
