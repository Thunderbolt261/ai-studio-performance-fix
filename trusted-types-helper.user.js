// ==UserScript==
// @name         Trusted-Types Helper
// @version      0.1.0
// @description  Обходит блокировку Trusted Types CSP для userscript'ов
// @namespace    bp
// @author       Benjamin Philipp
// @include      *
// @run-at       document-start
// @noframes
// @grant        none
// ==/UserScript==

// IMPORTANT: For Google AI Studio, change overwrite_default to true
const overwrite_default = true;
const prefix = GM_info.script.name;

var passThroughFunc = function(string, sink){
    return string;
};

var TTPName = "passthrough";
var TTP_default, TTP = {
    createHTML: passThroughFunc,
    createScript: passThroughFunc,
    createScriptURL: passThroughFunc
};

var needsTrustedHTML = false;

function doit(){
    try{
        if(typeof window.isSecureContext !== 'undefined' && window.isSecureContext){
            if (window.trustedTypes && window.trustedTypes.createPolicy){
                needsTrustedHTML = true;
                if(trustedTypes.defaultPolicy){
                    log("TT Default Policy exists");
                    if(overwrite_default)
                        TTP = window.trustedTypes.createPolicy("default", TTP);
                    else
                        TTP = window.trustedTypes.createPolicy(TTPName, TTP);
                    TTP_default = trustedTypes.defaultPolicy;
                    log("Created custom passthrough policy. Use Policy '" + TTPName + "' in var 'TTP':", TTP);
                }
                else{
                    TTP_default = TTP = window.trustedTypes.createPolicy("default", TTP);
                }
                log("Trusted-Type Policies: TTP:", TTP, "TTP_default:", TTP_default);
            }
        }
    }catch(e){
        log(e);
    }
}

function log(...args){
    if("undefined" != typeof(prefix) && !!prefix)
        args = [prefix + ":", ...args];
    console.log(...args);
}

doit();
