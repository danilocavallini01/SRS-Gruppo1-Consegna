import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from 'express';
import passport, { session } from "passport";
import { WebSocket, Data } from 'ws';
import { createServer } from 'http';
import { exit } from 'process';
import authRoute from './routes/auth';
import "./passport";
import { COOKIE_KEY, PROD } from "../secrets";
import { dummyTfResponse, generateRandomString } from './util';
import { generativeModel } from './vertex_setup';
import { Firestore } from '@google-cloud/firestore';
import { PubSub, Topic, Subscription, Message } from '@google-cloud/pubsub';
import { GOOGLE_PROJECT_ID, GOOGLE_PUBSUB_TOPIC } from '../secrets';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import apiRouter from './routes/api';
const expressSession = require('express-session');
const dummySystem = true

enum WebSocketMessageType {
    GENERATE = 'generate',
    PREVIEW = 'preview',
    CONFIRM = 'confirm',
    ERROR = 'error'
}

interface WebSocketMessage {
    type: WebSocketMessageType;
    payload: any;
    meta?: {
        username?: string;
        sessionId?: string;
        requestId?: string;
        timestamp?: string; // ISO 8601
    };
}

const app = express();
const port = process.env.PORT || 8000;

console.log(PROD)

app.use(cors({
    origin: PROD ? 'https://react-frontend-pkkemnazlq-og.a.run.app' : 'http://localhost:5173',
    credentials: true
}));

app.use(expressSession({
    secret: COOKIE_KEY,
    resave: false,
    proxy: PROD,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        secure: PROD, // Set to true if using HTTPS
    }
}
));
// initialize passport
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser())
// authRoute
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('welcome to the Google OAuth 2.0 + JWT Node.js app!');
});

app.use("/auth", authRoute);
app.use('/api', apiRouter);

// Create HTTP server to attach WebSocket
const server = createServer(app);

// Track connected sockets
const sockets: WebSocket[] = [];

app.listen(port, () => console.log('App listening on port ' + port));
if (!GOOGLE_PUBSUB_TOPIC || !GOOGLE_PUBSUB_TOPIC) {
    server.close((err) => {
        console.log('server closed due to not set GCP variables')
        process.exit(err ? 1 : 0)
    })
}

// GCloud firestore
const firestore = new Firestore({
    projectId: GOOGLE_PROJECT_ID,
});

// Google Cloud Pub/Sub setup
const pubsub = new PubSub({ projectId: GOOGLE_PROJECT_ID });
const topic: Topic = pubsub.topic(GOOGLE_PUBSUB_TOPIC);
let subscription: Subscription

// Create subscription
topic.createSubscription("backend-llm-subscription-" + generateRandomString(10))
    .then((value) => {
        subscription = value[0]
        console.log("Subscription created")

        // Listen to Pub/Sub messages
        subscription.on('message', async (message: Message) => {
            const data: string = message.data.toString();
            console.log(`Received message from Pub/Sub: ${data}`);

            // TODO: handle message response
            //const aiResponse: string = await computeAiAnswer(data)
            sendWebSocketMessage(sockets[0], WebSocketMessageType.GENERATE, "This is a test message")
            message.ack();
        });

    })
    .catch((reason) => {
        console.log(reason)
        closeSubscription();
        exit
    });

process.on('SIGTERM', () => {
    console.info('SIGTERM signal received.');
    console.log('Closing http server.');
    server.close((err) => {
        console.log('Http server closed.');
        process.exit(err ? 1 : 0);
    });
    closeSubscription()
});

// Send terraform generate request to pub/sub
const generateTerraformFile = (message: WebSocketMessage, webSocket: WebSocket) => {
    const data: Buffer = Buffer.from(JSON.stringify({ data: message.payload, webSocket: 'ciao' }))
    topic.publishMessage({ data })
}

// Send a generic websocket message, taken from the frontend interafce
const sendWebSocketMessage = (
    socket: WebSocket,
    type: string,
    payload: any,
    meta: Partial<WebSocketMessage['meta']> = {}
) => {
    const message = {
        type,
        payload,
        meta: {
            ...meta,
            timestamp: new Date().toISOString()
        }
    };
    socket.send(JSON.stringify(message));
}

// Handle incoming websocket messages from frontend, aka the generate terraform requests
const handleWebSocketMessage = (webSocketData: Data, webSocket: WebSocket) => {
    const json: string = normalizeMessage(webSocketData)
    try {
        const message = JSON.parse(json) as WebSocketMessage;
        switch (message.type) {
            case WebSocketMessageType.PREVIEW:
                //generateTerraformFile(message, webSocket);
                break;
            case WebSocketMessageType.GENERATE:
                console.log("Generate request")
                generateTerraformFile(message, webSocket)
                break;
        }
    } catch (err) {
        console.error("Invalid JSON:", err);
    }
}

const closeSubscription = () => {
    if (subscription != null) {
        subscription.close(err => {
            if (err) {
                console.error("Error while trying to close the GCP Pub/Sub Subscription")
            }
        })
    }
};

function normalizeMessage(data: Data): string {
    if (typeof data === "string") return data;
    if (data instanceof Buffer) return data.toString();
    if (data instanceof ArrayBuffer) return Buffer.from(data).toString();
    if (Array.isArray(data)) return Buffer.concat(data).toString();
    return ""; // fallback
}