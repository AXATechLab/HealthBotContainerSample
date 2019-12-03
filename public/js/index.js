const english = ['en', 'en-gb', 'en-us', 'en_gb', 'en_us'];
const spanish = ['es', 'es-es', 'en_es'];

const defaultLocale = 'es-es';

const isValidLocale = candidate => ([...english, ...spanish].includes(candidate.toLowerCase()));

function getLocale() {
    const params = BotChat.queryParams(location.search);

    return (params.locale && isValidLocale(params.locale)) ? params.locale : defaultLocale;
}

const getGreetings = locale => {
    console.log('incoming locale:', locale);
    return english.includes(locale.toLowerCase()) ? 'Hello' : 'Hola';
};

function requestChatBot() {
    const oReq = new XMLHttpRequest();
    oReq.addEventListener("load", initBotConversation);
    oReq.open("GET", "/chatBot?userName=you");
    oReq.send();
}

function computeParameters() {
    const params = BotChat.queryParams(location.search);
    const builtParams = {};

    return { ...builtParams, ...params };
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
        domain =  "https://" +  tokenPayload.directLineURI + "/v3/directline";
    }
    const botConnection = new BotChat.DirectLine({
        token: tokenPayload.connectorToken,
        domain,
        webSocket: true
    });
    startChat(user, botConnection);
    console.log('used locale', locale);
    botConnection.postActivity({type: "event", value: jsonWebToken, from: user, name: "InitAuthenticatedConversation"}).subscribe(function (id) {});
    botConnection.postActivity({type: "message", text: greetings, from: user, locale}).subscribe(function (id) {console.log("Greetings: " + greetings)});
}

function startChat(user, botConnection) {
    const botContainer = document.getElementById('botContainer');
    botContainer.classList.add("wc-display");
    const locale = getLocale();
    console.log('init conversation with user:', user,' and locale: ',locale);
    BotChat.App({
        botConnection,
        user,
        locale,
        resize: 'detect'
    }, botContainer);
}
