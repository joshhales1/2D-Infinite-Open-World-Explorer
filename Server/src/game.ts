import { Network, Connection, IMessage } from './network';
import { Player } from './entities/player';
import { Entity } from './entities/entity';
import { Map, Tile } from './world/map';

export default class Game {

    network: Network;

    map: Map;

    players: Player[] = [];

    constructor() {
        this.network = new Network("vvvvvvvvvvvvvvvvvvvvvvvvv");
        this.map = new Map(this.network);

        this.network.onNewAuthSocket = (conn: Connection) => {

            let newPlayer = new Player(conn, this.map); 

            this.players.push(
                newPlayer
            );

            this.map.sendAllChunks(conn);
            this.map.sendAllEntities(conn);

            conn.sendObject('you', { ueid: newPlayer.serialize().ueid });        

        }


        this.network.onAuthSocketClose = (conn: Connection) => {

            let player = this.playerFromConnection(conn);
            player.removeFromWorld();

            this.players = this.players.filter((player) => { return player.conn !== conn });

        }

        this.network.onMessage('mv', (conn: Connection, message: IMessage) => {

            let player = this.playerFromConnection(conn);

            player.moving = parseInt(message.body.data);

        });

        this.network.onMessage('place', (conn: Connection, message: IMessage) => {

            let player = this.playerFromConnection(conn);

            player.placing = message.body.isPlacing === "true";
        });

        this.network.onMessage('break', (conn: Connection, message: IMessage) => {

            let player = this.playerFromConnection(conn);

            player.breaking = message.body.isBreaking === "true";

            /* OLD BREAKING MECHANICS
            let player = this.playerFromConnection(conn);

            let oldTile = this.map.getTile(player.x + player.facingX, player.y + player.facingY);

            oldTile.health -= 1;

            this.map.editTile(player.x + player.facingX, player.y + player.facingY, oldTile);
            */

        });

        this.network.onMessage('attack', (conn: Connection, message: IMessage) => {

            let player = this.playerFromConnection(conn);

            player.attacking = message.body.isAttacking === "true";

        });

        this.tick();

        this.network.listen(8080);

        new Entity(this.map, "placeholder" , 5, 5);
    }

    readonly tps = 16;
    readonly nspt = 1 / this.tps * 1e+9;

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
        } else {
            setTimeout(this.tick.bind(this), (this.nspt - dif) / 1e+6);
        }
    }

    loop() {

        this.map.tick();

        this.players.forEach(player => {

            player.tick();

        });
    }

    private playerFromConnection(conn: Connection) {
        return this.players.filter(player => player.conn === conn)[0];
    }
}