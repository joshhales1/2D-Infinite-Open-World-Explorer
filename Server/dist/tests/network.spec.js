"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("../network");
const WebSocket = require("ws");
var net;
var client;
jest.setTimeout(10000);
const port = 3000 + Number(process.env.JEST_WORKER_ID);
beforeAll(done => {
    net = new network_1.Network("");
    net.listen(port);
    done();
});
afterAll(done => {
    net.close();
    done();
});
beforeEach(done => {
    client = new WebSocket("ws://localhost:" + port);
    client.on("open", () => {
        done();
    });
});
afterEach(done => {
    if (client)
        if (client.OPEN)
            client.close();
    done();
});
describe("The network object should", () => {
    test("respond when a client authenticates correctly", (done) => {
        client.send(network_1.Network.writeMessage("user_token", { key: "josh" }));
        client.on("message", (data) => {
            let openMessage = network_1.Network.openMessage(data.toString());
            expect(openMessage.head).toEqual("server");
            expect(openMessage.body.data).toEqual("successful connection");
            done();
        });
    });
    test("should do nothing if a user authenticates incorrectly", (done) => {
        client.send(network_1.Network.writeMessage("fake_user_token", { key: "josh" }));
        client.on("message", (data) => {
            let openMessage = network_1.Network.openMessage(data.toString());
            expect(openMessage.head).toEqual("server");
            expect(openMessage.body.data).toEqual("waiting for user_token");
            done();
        });
    });
    test("should do nothing if a user authenticates multiple times", (done) => {
        let messagesRecieved = 0;
        client.send(network_1.Network.writeMessage("user_token", { key: "josh" }));
        client.on("message", (data) => {
            messagesRecieved++;
            client.send(network_1.Network.writeMessage("user_token", { key: "josh" }));
            if (messagesRecieved == 2) {
                expect(net.numberOfAuthSockets).toEqual(1);
                done();
            }
        });
    });
});
