"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("./network");
const player_1 = require("./entities/player");
const entity_1 = require("./entities/entity");
const map_1 = require("./world/map");
class Game {
    constructor() {
        this.players = [];
        this.tps = 16;
        this.nspt = 1 / this.tps * 1e+9;
        this.network = new network_1.Network("vvvvvvvvvvvvvvvvvvvvvvvvv");
        this.map = new map_1.Map(this.network);
        this.network.onNewAuthSocket = (conn) => {
            let newPlayer = new player_1.Player(conn, this.map);
            this.players.push(newPlayer);
            this.map.sendAllChunks(conn);
            this.map.sendAllEntities(conn);
            conn.sendObject('you', { ueid: newPlayer.serialize().ueid });
        };
        this.network.onAuthSocketClose = (conn) => {
            let player = this.playerFromConnection(conn);
            player.removeFromWorld();
            this.players = this.players.filter((player) => { return player.conn !== conn; });
        };
        this.network.onMessage('mv', (conn, message) => {
            let player = this.playerFromConnection(conn);
            player.moving = parseInt(message.body.data);
        });
        this.network.onMessage('place', (conn, message) => {
            let player = this.playerFromConnection(conn);
            player.placing = message.body.isPlacing === "true";
        });
        this.network.onMessage('break', (conn, message) => {
            let player = this.playerFromConnection(conn);
            player.breaking = message.body.isBreaking === "true";
            /* OLD BREAKING MECHANICS
            let player = this.playerFromConnection(conn);

            let oldTile = this.map.getTile(player.x + player.facingX, player.y + player.facingY);

            oldTile.health -= 1;

            this.map.editTile(player.x + player.facingX, player.y + player.facingY, oldTile);
            */
        });
        this.network.onMessage('attack', (conn, message) => {
            let player = this.playerFromConnection(conn);
            player.attacking = message.body.isAttacking === "true";
        });
        this.tick();
        this.network.listen(8080);
        new entity_1.Entity(this.map, "placeholder", 5, 5);
    }
    tick() {
        if (Math.floor(Math.random() * 100) == 0) {
            this.network.testLatencies();
        }
        let start = process.hrtime()[0] * 1e+9 + process.hrtime()[1];
        this.loop();
        let end = process.hrtime()[0] * 1e+9 + process.hrtime()[1];
        let dif = end - start;
        if (dif > this.nspt) {
            console.log("Behind");
            return this.tick();
        }
        else {
            setTimeout(this.tick.bind(this), (this.nspt - dif) / 1e+6);
        }
    }
    loop() {
        this.map.tick();
        this.players.forEach(player => {
            player.tick();
        });
    }
    playerFromConnection(conn) {
        return this.players.filter(player => player.conn === conn)[0];
    }
}
exports.default = Game;
