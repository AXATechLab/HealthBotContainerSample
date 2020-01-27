const english = ['en', 'en-gb', 'en-us', 'en_gb', 'en_us'];
const spanish = ['es', 'es-es', 'en_es'];

const defaultLocale = 'es-es';
let hasAcceptedCookie = false;
const cookiesDocument = '/assets/20200107-cookie_policy.pdf';
const termsDocument = '/assets/20191220-terms_and_conditions.pdf';
const cookieDisclaimer = document.getElementById('cookie_disclaimer');

function isPhone(elem) {
    return elem.href && /^tel:[0-9]/.test(elem.href);
}
function setRelAttribute() {
    const elems = document.body.getElementsByTagName('a');

    for (let i = 0; i < elems.length; i++) {
        const elem = elems[i];
        const attributes = isPhone(elem) ? 'nofollow' : 'noopener noreferrer nofollow';

        elem.setAttribute('rel', attributes);
    }
}

function ready(callback) {
    if (document.readyState !== 'loading') {
        return callback();
    }
    document.addEventListener('DOMContentLoaded', callback);
}

ready(function getReady() { 
    document.body.addEventListener('DOMSubtreeModified', function () {
        setRelAttribute();
    }, false);

    startApplication();
});

function isValidLocale(candidate) {
    const validLangs = english.concat(spanish);

    return validLangs.includes(candidate.toLowerCase());
}

function getLocale() {
    const params = BotChat.queryParams(location.search);

    return (params.locale && isValidLocale(params.locale)) ? params.locale : defaultLocale;
}

function getGreetings(locale) {
    return english.includes(locale.toLowerCase()) ? 'Hello' : 'Hola';
}

function setupCookieDisclaimer(callback) {
    const cookieLink = document.getElementById('cookie-link');
    const acceptCookieButton = document.getElementById('accept_cookie');
    const declineCookieButton = document.getElementById('decline_cookie');

    cookieLink.href = cookiesDocument;

    acceptCookieButton.addEventListener('click', function(event) {
        event.preventDefault();
        cookieDisclaimer.style.display = 'none';
        hasAcceptedCookie = true;
        callback();
    });

    declineCookieButton.addEventListener('click', function(event) {
        event.preventDefault();
        cookieDisclaimer.style.display = 'none';
        hasAcceptedCookie = false;
        callback();
    });
}

function requestCookie(callback) {
    const oReq = new XMLHttpRequest();

    oReq.open('GET', '/has-cookie', true);
    oReq.onreadystatechange = function (aEvt) {
        if (oReq.readyState == 4) {
            if(oReq.status == 200) {
                const parsedResponse = JSON.parse(oReq.responseText);

                if (parsedResponse && parsedResponse.hasCookie) {
                    cookieDisclaimer.style.display = 'none';
                    hasAcceptedCookie = true;
                    callback();
                } else {
                    setupCookieDisclaimer(callback);
                    cookieDisclaimer.style.display = 'block';
                }
            }
        }
    };
    oReq.send(null);
}

function removeElementById(elementId) {
    var element = document.getElementById(elementId);
    element.parentNode.removeChild(element);
}

function requestChatbot() {
    const oReq = new XMLHttpRequest();

    oReq.addEventListener('load', initBotConversation);
    oReq.open('POST', '/chatbot');
    oReq.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    oReq.send(JSON.stringify({ 'hasAcceptedCookie': hasAcceptedCookie }));
}

function startApplication() {
    requestCookie(requestChatbot);
}

function initBotConversation() {
    const locale = getLocale();
    const greetings = getGreetings(locale);

    if (this.status >= 400) {
        console.error('bot init error');
        return;
    }
    const jsonWebToken = this.response;
    const tokenPayload = JSON.parse(atob(jsonWebToken.split('.')[1]));
    const user = {
        id: tokenPayload.userId,
        name: tokenPayload.userName,
        hasAcceptedCookie
    };
    let domain = undefined;
    if (tokenPayload.directLineURI) {
        domain = `https://${tokenPayload.directLineURI}/v3/directline`;
    }
    const botConnection = new BotChat.DirectLine({
        token: tokenPayload.connectorToken,
        domain: domain,
        webSocket: true
    });
    startChat(user, botConnection);
    botConnection.postActivity({type: 'event', value: jsonWebToken, from: user, name: 'InitAuthenticatedConversation'}).subscribe(function (id) {});
    botConnection.postActivity({type: 'message', text: greetings, from: user, locale: locale}).subscribe(function (id) {console.log('Greetings: ' + greetings)});
}

function startChat(user, botConnection) {
    removeElementById('pre-wc-header');
    const botContainer = document.getElementById('botContainer');
    botContainer.classList.add('wc-display');
    const locale = getLocale();

    BotChat.App({
        botConnection: botConnection,
        user: user,
        locale: locale,
        resize: 'detect'
    }, botContainer);
    addHeaderLink();
}

function addHeaderLink() {
    var headerLink = document.createElement('div');
    var wcHeader = document.getElementsByClassName('wc-header');

    headerLink.id = 'tc-header-link';
    headerLink.className = 'header-link';
    headerLink.innerHTML = '<div><a href="' + termsDocument + '" target="_blank">Términos y condiciones de uso</a></div>' + 
        '<div><a href="' + cookiesDocument + '" target="_blank">Política de cookies</a></div>';
    wcHeader[0].appendChild(headerLink);
}
