"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const http_1 = require("http");
const process_1 = require("process");
const auth_1 = __importDefault(require("./routes/auth"));
require("./passport");
const secrets_1 = require("../secrets");
const util_1 = require("./util");
const firestore_1 = require("@google-cloud/firestore");
const pubsub_1 = require("@google-cloud/pubsub");
const secrets_2 = require("../secrets");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const api_1 = __importDefault(require("./routes/api"));
const expressSession = require('express-session');
const axios = require('axios');
const dummySystem = true;
var WebSocketMessageType;
(function (WebSocketMessageType) {
    WebSocketMessageType["GENERATE"] = "generate";
    WebSocketMessageType["PREVIEW"] = "preview";
    WebSocketMessageType["CONFIRM"] = "confirm";
    WebSocketMessageType["ERROR"] = "error";
})(WebSocketMessageType || (WebSocketMessageType = {}));
const app = (0, express_1.default)();
const port = process.env.PORT || 8000;
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(expressSession({
    secret: secrets_1.COOKIE_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        secure: false, // Set to true if using HTTPS
    }
}));
// initialize passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use((0, cookie_parser_1.default)());
// authRoute
app.use(express_1.default.json());
app.use("/auth", auth_1.default);
app.get('/', (req, res) => {
    res.send('welcome to the Google OAuth 2.0 + JWT Node.js app!');
});
app.use('/api', api_1.default);
// Create HTTP server to attach WebSocket
const server = (0, http_1.createServer)(app);
// Track connected sockets
const sockets = [];
app.listen(port, () => console.log('App listening on port ' + port));
if (!secrets_2.GOOGLE_PUBSUB_TOPIC || !secrets_2.GOOGLE_PUBSUB_TOPIC) {
    server.close((err) => {
        console.log('server closed due to not set GCP variables');
        process.exit(err ? 1 : 0);
    });
}
// GCloud firestore
const firestore = new firestore_1.Firestore({
    projectId: secrets_2.GOOGLE_PROJECT_ID,
});
// Google Cloud Pub/Sub setup
const pubsub = new pubsub_1.PubSub({ projectId: secrets_2.GOOGLE_PROJECT_ID });
const topic = pubsub.topic(secrets_2.GOOGLE_PUBSUB_TOPIC);
let subscription;
// Create subscription
topic.createSubscription("backend-llm-subscription-" + (0, util_1.generateRandomString)(10))
    .then((value) => {
    subscription = value[0];
    console.log("Subscription created");
    // Listen to Pub/Sub messages
    subscription.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
        const data = message.data.toString();
        console.log(`Received message from Pub/Sub: ${data}`);
        // TODO: handle message response
        //const aiResponse: string = await computeAiAnswer(data)
        sendWebSocketMessage(sockets[0], WebSocketMessageType.GENERATE, "This is a test message");
        message.ack();
    }));
})
    .catch((reason) => {
    console.log(reason);
    closeSubscription();
    process_1.exit;
});
process.on('SIGTERM', () => {
    console.info('SIGTERM signal received.');
    console.log('Closing http server.');
    server.close((err) => {
        console.log('Http server closed.');
        process.exit(err ? 1 : 0);
    });
    closeSubscription();
});
// Send terraform generate request to pub/sub
const generateTerraformFile = (message, webSocket) => {
    const data = Buffer.from(JSON.stringify({ data: message.payload, webSocket: 'ciao' }));
    topic.publishMessage({ data });
};
// Send a generic websocket message, taken from the frontend interafce
const sendWebSocketMessage = (socket, type, payload, meta = {}) => {
    const message = {
        type,
        payload,
        meta: Object.assign(Object.assign({}, meta), { timestamp: new Date().toISOString() })
    };
    socket.send(JSON.stringify(message));
};
// Handle incoming websocket messages from frontend, aka the generate terraform requests
const handleWebSocketMessage = (webSocketData, webSocket) => {
    const json = normalizeMessage(webSocketData);
    try {
        const message = JSON.parse(json);
        switch (message.type) {
            case WebSocketMessageType.PREVIEW:
                //generateTerraformFile(message, webSocket);
                break;
            case WebSocketMessageType.GENERATE:
                console.log("Generate request");
                generateTerraformFile(message, webSocket);
                break;
        }
    }
    catch (err) {
        console.error("Invalid JSON:", err);
    }
};
const closeSubscription = () => {
    if (subscription != null) {
        subscription.close(err => {
            if (err) {
                console.error("Error while trying to close the GCP Pub/Sub Subscription");
            }
        });
    }
};
function normalizeMessage(data) {
    if (typeof data === "string")
        return data;
    if (data instanceof Buffer)
        return data.toString();
    if (data instanceof ArrayBuffer)
        return Buffer.from(data).toString();
    if (Array.isArray(data))
        return Buffer.concat(data).toString();
    return ""; // fallback
}
