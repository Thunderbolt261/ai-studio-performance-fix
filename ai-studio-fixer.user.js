// ==UserScript==
// @name         Google AI Studio Performance & UX Fixer
// @namespace    http://tampermonkey.net/
// @version      1
// @description  Фикс лагов ввода, мерцания текста и драки за скролл в AI Studio
// @author       Diyar Baban
// @match        https://aistudio.google.com/*
// @grant        none
// @run-at       document-start
// @inject-into page
// ==/UserScript==

(function(){
    'use strict';

    const log = (message, ...args) => console.log('[AI Studio Fixer v1]', message, ...args);

    const addGlobalStyle = () => {
        const styleId = 'ai-studio-fixer-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            * {
                transition-property: none !important;
                animation: none !important;
                scroll-behavior: auto !important;
            }

            .turn, ms-chat-turn {
                contain: layout paint !important;
                padding-bottom: 24px !important;
            }

            .conversation-container, .turns-container { background: #1E1E1E !important; }
            .turn {
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                padding-top: 8px !important;
                margin: 0 !important;
            }
            .prompt-textarea { box-shadow: none !important; border-top: 1px solid #3a3a3a !important; }
            .turn-footer .right-items, .turn-footer .model-info, .turn-footer .tools-info { display: none !important; }
            .turn-footer { min-height: auto !important; padding-top: 4px !important; }
            pre, code { background-color: #252526 !important; border: 1px solid #333 !important; }
        `;
        document.documentElement.appendChild(style);
        log('Performance & UI CSS injected.');
    };

    const fixDisappearingContent = () => {
        const originalIntersectionObserver = window.IntersectionObserver;
        window.IntersectionObserver = function(callback, options) {
            const newCallback = (entries, observer) => {
                const modifiedEntries = entries.map(entry => {
                    if (entry.target.closest('.turn, ms-chat-turn') && !entry.isIntersecting) {
                        return new Proxy(entry, {
                            get: (target, prop) => (prop === 'isIntersecting' ? true : Reflect.get(target, prop))
                        });
                    }
                    return entry;
                });
                return callback(modifiedEntries, observer);
            };
            return new originalIntersectionObserver(newCallback, options);
        };
        log('Disappearing content/flicker fix is active.');
    };

    const fixScrollFighting = (chatContainer) => {
        const originalScrollIntoView = Element.prototype.scrollIntoView;
        let isUserScrolling = false;
        let scrollBlockTimer;

        const blockAppScrolls = () => {
            isUserScrolling = true;
            clearTimeout(scrollBlockTimer);
            scrollBlockTimer = setTimeout(() => isUserScrolling = false, 1000);
        };

        chatContainer.addEventListener('wheel', blockAppScrolls, { passive: true, capture: true });
        chatContainer.addEventListener('keydown', blockAppScrolls, { passive: true, capture: true });

        document.body.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (button && button.getAttribute('aria-label')?.toLowerCase().includes('edit')) {
                const turnElement = e.target.closest('ms-chat-turn');
                if (turnElement) {
                    log('Edit click detected. Manually scrolling element into view.');
                    setTimeout(() => {
                        turnElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 50);
                }
            }
        }, true);

        Element.prototype.scrollIntoView = function(...args) {
            if (isUserScrolling && chatContainer.contains(this)) {
                log('Blocked app-forced scroll due to user wheel/key action.');
                return;
            }
            return originalScrollIntoView.apply(this, args);
        };

        log('Direct-control scroll fix is active.');
    };

    let fixesInitialized = false;
    const runAllFixes = () => {
        if (fixesInitialized || !document.body) return;

        addGlobalStyle();
        fixDisappearingContent();

        const observer = new MutationObserver(() => {
            const chatContainer = document.querySelector('main .conversation-container');
            if (chatContainer) {
                log('Chat container found. Applying targeted fixes.');
                fixScrollFighting(chatContainer);
                fixesInitialized = true;
                observer.disconnect();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAllFixes);
    } else {
        runAllFixes();
    }
})();
