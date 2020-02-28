var english = ['en', 'en-gb', 'en-us', 'en_gb', 'en_us', 'it_it'];
var italian = ['it', 'it_it', 'it-it'];
var spanish = ['es', 'es-es', 'en_es'];

var defaultLocale = 'es-es';
var hasAcceptedCookie = false;
var cookiesDocument = '/assets/20200107-cookie_policy.pdf';
var termsDocument = '/assets/20191220-terms_and_conditions.pdf';
var cookieDisclaimer = document.getElementById('cookie_disclaimer');

function ieVersion(uaString) {
  uaString = uaString || navigator.userAgent;
  var match = /\b(MSIE |Trident.*?rv:|Edge\/)(\d+)/.exec(uaString);
  if (match) return parseInt(match[2])
}

function isPhone(elem) {
    return elem.href && /^tel:[0-9]/.test(elem.href);
}
function setRelAttribute() {
    var elems = document.body.getElementsByTagName('a');

    for (var i = 0; i < elems.length; i++) {
        var elem = elems[i];
        var attributes = isPhone(elem) ? 'nofollow' : 'noopener noreferrer nofollow';

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
    var ieversion = ieVersion();

    if (!ieversion) {
        document.body.addEventListener('DOMSubtreeModified', function () {
            setRelAttribute();
        }, false);
    }

    if (!ieversion || ieversion > 9) {
        startApplication();
    } else {
        cookieDisclaimer.style.display = 'none';
    }
});

function isValidLocale(candidate) {
    var validLangs = english.concat(spanish);

    validLangs = italian.concat(validLangs);

    return validLangs.includes(candidate.toLowerCase());
}

function getLocale() {
    var params = BotChat.queryParams(location.search);

    return (params.locale && isValidLocale(params.locale)) ? params.locale : defaultLocale;
}

function getGreetings(locale) {
    return english.includes(locale.toLowerCase()) ? 'Hello' : 'Hola';
}

function setupCookieDisclaimer(callback) {
    var cookieLink = document.getElementById('cookie-link');
    var acceptCookieButton = document.getElementById('accept_cookie');
    var declineCookieButton = document.getElementById('decline_cookie');

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
    var oReq = new XMLHttpRequest();

    oReq.open('GET', '/has-cookie', true);
    oReq.onreadystatechange = function (aEvt) {
        if (oReq.readyState == 4) {
            if(oReq.status == 200) {
                var parsedResponse = JSON.parse(oReq.responseText);

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
    var oReq = new XMLHttpRequest();

    oReq.addEventListener('load', initBotConversation);
    oReq.open('POST', '/chatbot');
    oReq.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    oReq.send(JSON.stringify({ 'hasAcceptedCookie': hasAcceptedCookie }));
}

function startApplication() {
    requestCookie(requestChatbot);
}

function initBotConversation() {
    var locale = getLocale();
    var greetings = getGreetings(locale);

    if (this.status >= 400) {
        console.error('bot init error');
        return;
    }
    var jsonWebToken = this.response;
    var tokenPayload = JSON.parse(atob(jsonWebToken.split('.')[1]));
    var user = {
        id: tokenPayload.userId,
        name: tokenPayload.userName,
        hasAcceptedCookie: hasAcceptedCookie
    };
    var domain = undefined;
    if (tokenPayload.directLineURI) {
        domain = 'https://' + tokenPayload.directLineURI + '/v3/directline';
    }
    var botConnection = new BotChat.DirectLine({
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
    var botContainer = document.getElementById('botContainer');
    botContainer.classList.add('wc-display');
    var locale = getLocale();

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
