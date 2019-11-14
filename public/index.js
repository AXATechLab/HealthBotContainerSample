
const getDictionary = locale => {
    const d = {
        es: {
            greetings: 'Hola'
        },
        en: {
            greetings: 'Hello'
        }
    };
    let dictionary;
    // const spanish = ['es', 'es-es', 'es_es'];
    const english = ['en', 'en-gb', 'en-us', 'en_gb', 'en_us'];

    if (english.includes(locale.toLowerCase())) {
        dictionary = d.en;
    } else {
        dictionary = d.es;
    }

    return dictionary;
};

function requestChatBot(loc) {
    const params = computeParameters();
    const oReq = new XMLHttpRequest();
    oReq.addEventListener("load", initBotConversation);
    var path = "/chatBot";
    path += ((params["userName"]) ? "?userName=" + params["userName"] : "?userName=you");
    if (loc) {
        path += "&lat=" + loc.lat + "&long=" + loc.long;
    }

    oReq.open("GET", path);
    oReq.send();
}

function computeParameters() {
    const params = BotChat.queryParams(location.search);
    const builtParams = {};

    return { ...builtParams, ...params };
}

function chatRequested() {
    const params = BotChat.queryParams(location.search);

   requestChatBot();
}

function getLocale() {
    const params = BotChat.queryParams(location.search);

    return (params.locale) ? params.locale : 'en';
}

function initBotConversation() {
    const locale = getLocale();
    if (this.status >= 400) {
        alert(this.statusText);
        return;
    }
    // extract the data from the JWT
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
    botConnection.postActivity({type: "event", value: jsonWebToken, from: user, name: "InitAuthenticatedConversation"}).subscribe(function (id) {});
    botConnection.postActivity({type: "message", text: getDictionary(locale).greetings, from: user}).subscribe(function (id) {console.log("hello!")});
}

function startChat(user, botConnection) {
    const botContainer = document.getElementById('botContainer');
    botContainer.classList.add("wc-display");
    const locale = getLocale();
    console.log('init conversation with user:', user);
    BotChat.App({
        botConnection,
        user,
        locale,
        resize: 'detect'
    }, botContainer);
}
