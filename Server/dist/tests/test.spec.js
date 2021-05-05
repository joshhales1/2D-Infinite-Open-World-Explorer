"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const world_generation_1 = require("../world/world-generation");
const network_1 = require("../network");
const WebSocket = require("ws");
var net;
var client;
jest.setTimeout(10000);
const port = 3000 + Number(process.env.JEST_WORKER_ID);
beforeAll(done => {
    net = new network_1.Network();
    net.listen(port);
    net.onNewAuthSocket = () => {
        net.broadcast("hello", { data: "world" });
    };
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
test("Worlds generated with same seed should seralize to the same values.", () => {
    let newWorld = new world_generation_1.WorldGeneration("0", "0");
    let chunk = newWorld.chunk(0, 0);
    expect(chunk.serialize()).toBe("22222222222222222222111111111111/22222222222222221111111111111111/22222222222211111111111111111111/22222222221111111111111111111111/22222211111111111111111111111111/22222211111111111111111111111111/22221111111111111111111111111111/22111111111111111111111111111111/11111111111111111111111111111111/11111111111111111111111111111111/11111111111111111111111111111111/11111111111111111111111111111111/11111111111111111111111111111111/11111111111111111111111111111111/11111111111111111111111111111111/11111111111111111111111111111111/");
});
test("Connect to server.", (done) => {
    client.send(network_1.Network.writeMessage("user_token", { key: "josh" }));
    client.on("message", (data) => {
        let openMessage = network_1.Network.openMessage(data.toString());
        expect(openMessage.head).toEqual("hello");
        expect(openMessage.body.data).toEqual("world");
        done();
    });
});
