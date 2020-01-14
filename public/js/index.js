const english = ['en', 'en-gb', 'en-us', 'en_gb', 'en_us'];
const spanish = ['es', 'es-es', 'en_es'];

const defaultLocale = 'es-es';

function setRelAttribute() {
    const elems = document.body.getElementsByTagName('a');
    for (let i = 0; i < elems.length; i++) {
        const elem = elems[i];
        elem.setAttribute('rel', 'noopener noreferrer nofollow');
    }
}

const ready = (callback) => {
    if (document.readyState !== 'loading') callback();
    else document.addEventListener('DOMContentLoaded', callback);
}

ready(() => { 
    document.body.addEventListener('DOMSubtreeModified', function () {
        setRelAttribute();
    }, false);
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
    console.log('incoming locale:', locale);
    return english.includes(locale.toLowerCase()) ? 'Hello' : 'Hola';
}

function requestChatBot() {
    const oReq = new XMLHttpRequest();
    oReq.addEventListener('load', initBotConversation);
    oReq.open('GET', '/chatBot?userName=you');
    oReq.send();
}

function initBotConversation() {
    const locale = getLocale();
    const greetings = getGreetings(locale);

    if (this.status >= 400) {
        console.error(this.statusText);
        return;
    }
    const jsonWebToken = this.response;
    const tokenPayload = JSON.parse(atob(jsonWebToken.split('.')[1]));
    const user = {
        id: tokenPayload.userId,
        name: tokenPayload.userName
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
    console.log('used locale', locale);
    botConnection.postActivity({type: 'event', value: jsonWebToken, from: user, name: "InitAuthenticatedConversation"}).subscribe(function (id) {});
    botConnection.postActivity({type: 'message', text: greetings, from: user, locale: locale}).subscribe(function (id) {console.log("Greetings: " + greetings)});
}

function startChat(user, botConnection) {
    const botContainer = document.getElementById('botContainer');
    botContainer.classList.add('wc-display');
    const locale = getLocale();
    // console.log('init conversation with user:', user,' and locale: ',locale);
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
    console.log('wcHeader ',wcHeader);
    headerLink.id = 'tc-header-link';
    headerLink.className = 'header-link';
    headerLink.innerHTML = '<div><a href="/assets/20191220-terms_and_conditions.pdf" target="_blank">Términos y condiciones de uso</a></div>' + 
        '<div><a href="/assets/20200107-cookie_policy.pdf" target="_blank">Política de cookies</a></div>';
    wcHeader[0].appendChild(headerLink);
}

