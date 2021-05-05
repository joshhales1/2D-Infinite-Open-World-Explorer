import { Network } from "../network";
import WebSocket = require('ws');

var net: Network;
var client: WebSocket;
jest.setTimeout(10000);
const port = 3000 + Number(process.env.JEST_WORKER_ID);

beforeAll(done => {

    net = new Network("");

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

        client.send(Network.writeMessage("user_token", { key: "josh" }));

        client.on("message", (data) => {

            let openMessage = Network.openMessage(data.toString());

            expect(openMessage.head).toEqual("server");
            expect(openMessage.body.data).toEqual("successful connection");

            done();

        });

    });

    test("should do nothing if a user authenticates incorrectly", (done) => {

        client.send(Network.writeMessage("fake_user_token", { key: "josh" }));

        client.on("message", (data) => {

            let openMessage = Network.openMessage(data.toString());

            expect(openMessage.head).toEqual("server");
            expect(openMessage.body.data).toEqual("waiting for user_token");

            done();

        });
    });

    test("should do nothing if a user authenticates multiple times", (done) => {

        let messagesRecieved = 0;

        client.send(Network.writeMessage("user_token", { key: "josh" }));

        client.on("message", (data) => {

            messagesRecieved++;
            client.send(Network.writeMessage("user_token", { key: "josh" }));

            if (messagesRecieved == 2) {

                expect(net.numberOfAuthSockets).toEqual(1);

                done();
            }
                

        });

    });

});



