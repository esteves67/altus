const {
    remote,
    ipcRenderer
} = require('electron');

const {
    setupWAPI
} = require('./wapi/wapi');

const {
    enableOnlineIndicator,
    enableOnlineNotification,
    enableQuickReplies,
} = require('./experimental');

const Store = require('electron-store');

const themes = new Store({
    name: "themes"
});

// Fix for "WhatsApp works with Chrome 36+" issue . DO NOT REMOVE
var ses = remote.session.defaultSession;

ses.flushStorageData();
ses.clearStorageData({
    storages: ['appcache', 'serviceworkers', 'cachestorage', 'websql', 'indexdb'],
});

if (window.navigator.serviceWorker) {
    window.navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
            registration.unregister();
        }
    });
}

window.onload = () => {
    const titleEl = document.querySelector('.landing-title');
    if (titleEl && titleEl.innerHTML.includes('Google Chrome 49+')) {
        window.location.reload();
    }

    // Message Indicator
    // Using MutationObserver to check for changes in the title of the WhatsApp page and sending an IPC message to the main process
    new MutationObserver(function (mutations) {
        let title = mutations[0].target.innerText;
        let titleRegEx = /([0-9]+)/;
        let number = titleRegEx.exec(title) ? (parseInt(titleRegEx.exec(title)[0]) !== 0 && parseInt(titleRegEx.exec(title)[0]) !== undefined && parseInt(titleRegEx.exec(title)[0]) !== null) ? parseInt(titleRegEx.exec(title)[0]) : null : null;
        ipcRenderer.send('message-indicator', number);
    }).observe(
        document.querySelector('title'), {
            subtree: true,
            childList: true,
            characterData: true
        }
    );

    new MutationObserver(mutations => {
        // Check when WhatsApp is done loading
        if (mutations[0].removedNodes && mutations[0].removedNodes[0].id === 'startup') {
            let tabId = document.querySelector('[id^="whatsapp-style"]').id.replace('whatsapp-style-', '');
            ipcRenderer.send('set-experimental-features', tabId);
        }
    }).observe(document.querySelector('#app'), {
        subtree: true,
        childList: true
    });

    // Mouse wheel event listener for zoom
    document.body.addEventListener('wheel', e => {
        // Mouse wheel delta value. (+1 when scroll up | -1 when scroll down)
        const delta = Math.sign(e.deltaY);

        if (e.ctrlKey) {
            switch (delta) {
                case -1:
                    ipcRenderer.send('zoom-in');
                    break;

                case +1:
                    ipcRenderer.send('zoom-out');
                    break;

                default:
                    break;
            }
        }
    });

    // Open links in external browser
    document.body.addEventListener('click', e => {
        if (e.target.tagName === 'A' && e.target.getAttribute('target') === '_blank') {
            ipcRenderer.send('link-open', e.target.href);
        }
    });
}

ipcRenderer.on('set-experimental-features', (_, exp) => {
    if (exp.value) {
        setupWAPI()

        exp.features.forEach(feature => {
            if (feature === 'online-indicator') enableOnlineIndicator();
            if (feature === 'quick-replies') enableQuickReplies(exp.id);
        });
    }
});

ipcRenderer.on('theme', (_, theme_name) => {
    let theme = themes.get("themes").find(theme => theme.name === theme_name);

    if (theme_name === "Dark") {
        if (!document.body.classList.contains("dark")) document.body.classList.add("dark");
        if (document.querySelector("#whatsapp-style")) document.querySelector("#whatsapp-style").innerHTML = "";
        return;
    }

    if (theme_name === "Default") {
        if (document.body.classList.contains("dark")) document.body.classList.remove("dark");
        if (document.querySelector("#whatsapp-style")) document.querySelector("#whatsapp-style").innerHTML = "";
        return;
    }

    if (document.querySelector("#whatsapp-style")) {
        document.querySelector("#whatsapp-style").innerHTML = theme.css;
    } else {
        let theme_element = document.createElement("style");
        theme_element.id = "whatsapp-style";
        theme_element.innerHTML = theme.css;
        document.head.appendChild(theme_element);
    }

});