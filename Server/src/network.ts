import WebSocket = require('ws');
import { isUndefined } from 'util';
const crypto = require('crypto');

export class Network {

    private server: WebSocket.Server;

    private readonly customCallbacks: ICallbackKeyPair[] = [];
    private authSockets: Connection[] = []; 

    private readonly pingKeyPairs: Map<string, number> = new Map();

    public onNewAuthSocket: Function = () => { };
    public onAuthSocketClose: Function = () => { };

    private readonly verbosityLevel: number;

    public get numberOfAuthSockets(): number {
        return this.authSockets.length;
    }

    public constructor(verbosity: string = "") {
        this.verbosityLevel = verbosity.length;
    }

    public onMessage(key: string, callback: Function) {
        this.customCallbacks.push({ key: key, callback: callback });
    }

    public broadcast(head: string, body: object) {
        this.authSockets.forEach(conn => {

            conn.sendObject(head, body);
        });
    }

    public testLatencies() {
        this.authSockets.forEach(conn => {

            let key = crypto.randomBytes(4).toString('hex');

            this.pingKeyPairs.set(key, process.hrtime()[0] * 1e+9 + process.hrtime()[1]);            

            conn.sendObject('ping', { key: key });

        });
    }

    public listen(port: number) {

        const wss = new WebSocket.Server({ port: port });

        this.server = wss;

        wss.on('connection', ws => {

            this.log('New socket connected. Waiting for user_token before creating connection object.', 'vvv');

            ws.on('message', (message) => {

                let openMessage = Network.openMessage(message.toString());

                if (openMessage.head === "user_token") {

                    if (this.authSockets.filter(item => item._ws === ws).length > 0) {

                        ws.send(Network.writeMessage("server", { data: "bad second auth" }));
                        return this.log('Already authenticated user attempted to reauthenticate.', 'vvv');
                    }

                    let conn = new Connection(ws, openMessage.body.token);

                    this.authSockets.push(conn);

                    this.onNewAuthSocket(conn);

                    conn.sendObject("server", {data: "successful connection"});

                    this.log('New user authenticated.', 'vv');

                    return;
                }

                let conn = this.authSockets.filter(item => item._ws === ws)[0];

                if (conn) {
                    this.onMessageRecieved(
                        openMessage,
                        conn
                    );

                    conn.sendObject("ignore", {});

                } else {
                    ws.send(Network.writeMessage("server", { data: "waiting for user_token" }));
                }
                
            });

            ws.on('close', () => {

                let conn = this.authSockets.filter(item => item._ws === ws)[0];


                if (!isUndefined(conn)) {
                    this.onConnectionClosed(conn);

                    this.authSockets = this.authSockets.filter(item => item !== conn);

                    this.log('Authenticated user has disconnected', 'vv');
                }
                    
            });

        });

    }

    public close() {
        this.server.close();
    }

    private onMessageRecieved(message: IMessage, conn: Connection) {

        if (message.head === 'ping') {

            conn.ping = process.hrtime()[0] * 1e+9 + process.hrtime()[1] - this.pingKeyPairs.get(message.body.key);

            this.pingKeyPairs.delete(message.body.key);

            console.log('Ping was: ' + Math.round((conn.ping / 1e+6)) + 'ms');

            return;

        }

        this.customCallbacks.forEach(callback => {
            if (callback.key === message.head)
                callback.callback(conn, message);
        });

    }

    private onConnectionClosed(conn: Connection) {


        let index = this.authSockets.indexOf(conn);

        if (index > -1) {

            this.onAuthSocketClose(conn);

            this.authSockets.splice(index, 1);
        }

        
    }

    static writeMessage(head: string, body: object): string {

        let output = head + '&';
        Object.keys(body).forEach(key => {

            output += key + ':' + body[key] + '^';

        });

        return output;
    }

    static openMessage(input: string): IMessage {

        console.log(input);

        let outputObject = {};

        let split1 = input.split('&');

        if (split1.length !== 2) {
            throw 'Something is wrong..';
        }

        let head = split1[0];

        let body = split1[1];

        let split2 = body.split('^');

        if (split2.length % 2 !== 0) {
            throw 'Something else is wrong';
        }

        split2.forEach(pair => {

            if (pair === '')
                return;

            let split3 = pair.split(':');

            let key = split3[0];
            let value = split3[1];

            outputObject[key] = value;

        });

        return { head: head, body: outputObject }
    }

    log(message: string, verbosity: string) {

        if (verbosity.length <= this.verbosityLevel) {
            console.log(`[${new Date().toLocaleString()}] [${verbosity.length}] ${message}`);
        }

    }
}

export class Connection {

    _ws: WebSocket;

    token: string;

    ping: number;

    constructor(ws: WebSocket, token: string) {
        this._ws = ws;
        this.token = token;
    }

    sendObject(head: string, body: object) {
        this._ws.send(Network.writeMessage(head, body));
    }

}

interface ICallbackKeyPair {
    key: string,
    callback: Function,
}

export interface IMessage {
    head: string,
    body: any
}