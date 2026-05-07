// ==UserScript==
// @name         Octobox Resizable Thread Pane
// @namespace    https://octobox.io
// @version      2.0
// @description  Hide thread pane by default, show on notification select, drag to resize, close button to hide
// @match        https://octobox.io/*
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/wedamija/octobox-tools/main/ui-improvements.js
// @downloadURL  https://raw.githubusercontent.com/wedamija/octobox-tools/main/ui-improvements.js
// ==/UserScript==

(function () {
  'use strict';

  var STORAGE_KEY = 'octobox-thread-width';
  var MIN_WIDTH = 200;
  var DEFAULT_WIDTH = 500;
  var savedWidth = parseInt(localStorage.getItem(STORAGE_KEY), 10) || DEFAULT_WIDTH;

  // Visibility is driven purely by user actions (click notification / click X).
  // Never by content detection — that causes flicker on navigation and sync.
  var threadVisible = false;

  GM_addStyle(
    '.flex-thread { display: none !important; }' +
    '.flex-thread.ob-show { display: block !important; }' +
    '.ob-handle { width: 6px; flex-shrink: 0; cursor: col-resize; background: transparent; position: relative; z-index: 10; transition: background 0.15s; }' +
    '.ob-handle:hover, .ob-handle.ob-dragging { background: #0366d6; }' +
    '.ob-handle-hidden { display: none !important; }' +
    '.ob-close { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); z-index: 20; cursor: pointer; background: #e1e4e8; border: 1px solid #d1d5da; border-radius: 3px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 14px; line-height: 1; color: #586069; padding: 0; }' +
    '.ob-close:hover { background: #d1d5da; color: #24292e; }' +
    'tr.notification { cursor: pointer; }'
  );

  // ---- State application ----
  // Idempotent: safe to call any time, just syncs DOM to threadVisible.

  function applyState() {
    var thread = document.querySelector('.flex-thread');
    if (!thread) return;

    if (threadVisible) {
      thread.classList.add('ob-show');
      thread.style.flex = '0 0 ' + savedWidth + 'px';
      thread.style.width = savedWidth + 'px';
      thread.style.maxWidth = '70vw';
    } else {
      thread.classList.remove('ob-show');
      thread.style.flex = '';
      thread.style.width = '';
      thread.style.maxWidth = '';
    }

    ensureHandle();
  }

  // ---- Drag handle + close button ----

  function ensureHandle() {
    var content = document.querySelector('.flex-content');
    var thread = document.querySelector('.flex-thread');
    if (!content || !thread) return;

    var handle = content.querySelector(':scope > .ob-handle');

    // If handle exists but is in the wrong position (thread was replaced), remove and recreate.
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

    if (!handle.querySelector('.ob-close')) {
      var btn = document.createElement('button');
      btn.className = 'ob-close';
      btn.title = 'Hide thread pane';
      btn.textContent = '×';
      btn.addEventListener('mousedown', function (e) { e.stopPropagation(); });
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        threadVisible = false;
        applyState();
      });
      handle.appendChild(btn);
    }

    if (threadVisible) {
      handle.classList.remove('ob-handle-hidden');
    } else {
      handle.classList.add('ob-handle-hidden');
    }
  }

  function bindDrag(handle, content) {
    var dragging = false;

    handle.addEventListener('mousedown', function (e) {
      if (e.target.closest('.ob-close')) return;
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

  // ---- Click handling ----
  // Clicking anywhere in a notification row (except checkbox/star/other buttons)
  // selects that notification. We also mark the thread visible.

  document.addEventListener('click', function (e) {
    if (e.target.closest('.ob-close')) return;

    var row = e.target.closest('tr.notification');
    if (!row) return;
    if (e.target.closest('.custom-control-input, .toggle-star, label[for]')) return;

    var link = row.querySelector('a.link');
    if (!link) return;

    // Show thread pane
    threadVisible = true;
    applyState();

    // If click was not already on a link/button, simulate click on the title link
    if (!e.target.closest('a, button')) {
      link.click();
    }
  });

  // ---- Periodic sync ----
  // Re-applies state every second to survive DOM replacements from sync/navigation.

  setInterval(applyState, 1000);

  // Also run on DOM changes for snappier response.
  new MutationObserver(applyState).observe(document.body, { childList: true, subtree: true });

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyState);
  } else {
    applyState();
  }
})();
