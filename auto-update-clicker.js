// ==UserScript==
// @name         Octobox Auto-Update Clicker
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Clicks the update button on Octobox every interval when the tab is inactive
// @author       Your Name
// @match        https://octobox.io/*
// @match        http://localhost:3000/*
// @grant        none
// @updateURL    https://cdn.jsdelivr.net/gh/wedamija/octobox-tools@main/auto-update-clicker.js
// @downloadURL  https://cdn.jsdelivr.net/gh/wedamija/octobox-tools@main/auto-update-clicker.js
// ==/UserScript==
// NOTE: In Firefox, Tampermonkey requires "Allow user scripts" to be enabled
// in the extension's permissions (about:addons → Tampermonkey → Permissions).
// If this script isn't running, check that setting first.

(function() {
    'use strict';

    // Set the interval (in milliseconds) to check for activity and click the update button.
    // Adjust this value as needed (e.g., 30000 for 30 seconds).
    const updateInterval = 30000;

    // Function that checks if the tab is inactive and clicks the update button if found.
    function clickUpdateButton() {
        // Check if the tab is not active using the Page Visibility API
        if (document.hidden) {
            const updateButton = document.querySelector('a.btn.btn-sm.btn-outline-dark.js-sync.js-async');
            if (updateButton) {
                updateButton.click();
                console.log("Update button clicked.");
            } else {
                console.log("Update button not found. No action taken.");
            }
        } else {
            console.log("Page active, not clicking");
        }
    }

    // Use setInterval to run the function periodically
    setInterval(clickUpdateButton, updateInterval);

})();