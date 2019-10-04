
let isFirstTime = true;
const dictionary = {
    es: {
        greetings: 'Hola'
    },
    en: {
        greetings: 'Hello'
    }
}

function requestChatBot(loc) {
    const params = computeParameters();
    const oReq = new XMLHttpRequest();
    oReq.addEventListener("load", initBotConversation);
    var path = "/chatBot";
    path += ((params["userName"]) ? "?userName=" + params["userName"] : "?userName=you");
    if (loc) {
        path += "&lat=" + loc.lat + "&long=" + loc.long;
    }
    if (params['userId']) {
        path += "&userId=" + params['userId'];
    }
    oReq.open("GET", path);
    oReq.send();
}

function computeParameters() {
    const params = BotChat.queryParams(location.search);
    const builtParams = {};

    if (sessionStorage && sessionStorage.getItem('userId')) {
        builtParams.userId = sessionStorage.getItem('userId');
    }

    return { ...builtParams, ...params };
}

function chatRequested() {
    const params = BotChat.queryParams(location.search);
    var shareLocation = params["shareLocation"];
    if (shareLocation) {
        getUserLocation(requestChatBot);
    }
    else {
        requestChatBot();
    }
}

function getLocale() {
    const params = BotChat.queryParams(location.search);

    return (params.locale) ? params.locale : 'en';
}

function getUserLocation(callback) {
    navigator.geolocation.getCurrentPosition(
        function(position) {
            var latitude  = position.coords.latitude;
            var longitude = position.coords.longitude;
            var location = {
                lat: latitude,
                long: longitude
            }
            callback(location);
        },
        function(error) {
            // user declined to share location
            console.log("location error:" + error.message);
            callback();
        });
}

function sendUserLocation(botConnection, user) {
    getUserLocation(function (location) {
        botConnection.postActivity({type: "message", text: JSON.stringify(location), from: user}).subscribe(function (id) {console.log("success")});
    });
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
        name: tokenPayload.userName,
        isFirstTime
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
    botConnection.postActivity({type: "message", text: dictionary[locale].greetings, from: user}).subscribe(function (id) {console.log("hello!")});
    botConnection.activity$
        .filter(function (activity) {return activity.type === "event" && activity.name === "shareLocation"})
        .subscribe(function (activity) {sendUserLocation(botConnection, user)});
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