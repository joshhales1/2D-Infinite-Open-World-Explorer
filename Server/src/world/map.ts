import { Entity } from '../entities/entity';
import { WorldGeneration } from './world-generation';
import { Network, Connection } from '../network';
import { isUndefined } from 'util';

export class Map {

    editedChunks = {};

    private readonly chunkWidth = 16;

    private loadedChunks = {};

    readonly entites: Entity[] = [];

    readonly network: Network;

    private worldGen: WorldGeneration = new WorldGeneration(Math.random().toString(), Math.random().toString());

    constructor(network: Network) {
        this.network = network;
    }

    private static getChunkKey(x: number, y: number): string {
        return x.toString() + "," + y.toString();
    }

    private chunkPosFromRealPos(x: number, y: number): Vector {

        return {
            x: Math.floor(x / this.chunkWidth),
            y: Math.floor(y / this.chunkWidth)
        }

    }

    private loadChunk(x: number, y: number): Chunk {

        let ck = Map.getChunkKey(x, y);

        if (!Object.keys(this.loadedChunks).includes(ck)) {

            if (Object.keys(this.editedChunks).includes(ck)) { // IF DB CONTAINS

                this.loadedChunks[ck] = this.editedChunks[ck]; // SET LOADED CHUNKS TO DB RESULT


            } else {

                this.loadedChunks[ck] = this.worldGen.chunk(x, y);

            }           

            this.network.broadcast('load_chunk', (this.loadedChunks[ck] as Chunk).serialize());
        }

        return this.loadedChunks[ck];
    }

    private unloadChunk(x: number, y: number) {

        let ck = Map.getChunkKey(x, y);

        if (Object.keys(this.loadedChunks).includes(ck)) {

            delete this.loadedChunks[ck];

            this.network.broadcast('unload_chunk', {key: ck});

        }

    }

    private editTile(x: number, y: number, newTile: Tile) {

        let chunkCoords = this.chunkPosFromRealPos(x, y);
        let chunk = this.loadChunk(chunkCoords.x, chunkCoords.y);

        let relX = x - chunkCoords.x * this.chunkWidth;
        let relY = y - chunkCoords.y * this.chunkWidth;

        if (newTile.health < 1)
            newTile = new Tile(BlockType.air, newTile.floor);

        chunk.tiles[relX][relY] = newTile;

        let ck = Map.getChunkKey(chunkCoords.x, chunkCoords.y);

        this.loadedChunks[ck] = chunk; // Save to loaded
        this.editedChunks[ck] = chunk;

        this.network.broadcast('load_chunk', (this.loadedChunks[ck] as Chunk).serialize());
    }

    getTile(x: number, y: number): Tile {
        let chunkCoords = this.chunkPosFromRealPos(x, y);

        let chunk = this.loadChunk(chunkCoords.x, chunkCoords.y);

        let relX = x - chunkCoords.x * this.chunkWidth;
        let relY = y - chunkCoords.y * this.chunkWidth;

        return chunk.tiles[relX][relY];


    }

    addEntity(entity: Entity) {
        this.entites.push(entity);
    }

    removeEntity(entity: Entity) {
        delete this.entites[this.entites.indexOf(entity)];
    }

    tick() {

        let chunksKeysInUse: string[] = [];

        this.entites.forEach(entity => {

            let entityChunkPos = this.chunkPosFromRealPos(entity.x, entity.y);

            chunksKeysInUse.push(Map.getChunkKey(entityChunkPos.x, entityChunkPos.y));

            this.loadChunk(entityChunkPos.x, entityChunkPos.y);


        });

        Object.keys(this.loadedChunks).forEach(key => {

            if (!chunksKeysInUse.includes(key)) {
                this.unloadChunk(this.loadedChunks[key].x, this.loadedChunks[key].y);
            }

        });

    }

    sendAllChunks(conn: Connection) {

        Object.keys(this.loadedChunks).forEach(chunk => {
            conn.sendObject('load_chunk', (this.loadedChunks[chunk] as Chunk).serialize());
        });

    }

    sendAllEntities(conn: Connection) {
        this.entites.forEach(entity => {

            if (entity.visible)
                conn.sendObject('entity', entity.serialize());           

        });
    }

    public tryPlaceBlock(x: number, y: number, type: BlockType) {

        let oldTile = this.getTile(x, y)

        console.log("Trying to place");

        if (oldTile.block === BlockType.air && (isUndefined(this.entityAtPosition(x, y)) || this.entityAtPosition(x, y).collides === false)) {

            this.editTile(x, y, new Tile(type, oldTile.floor));

        }

    }

    public tryDamageBlock(x: number, y: number, damage: number) {
        let oldTile = this.getTile(x, y);

        if (oldTile.block !== BlockType.air) {
            this.editTile(x, y, new Tile(oldTile.block, oldTile.floor, oldTile.health -= damage));
        }
    }

    public entityAtPosition(x: number, y: number): Entity {

        return this.entites.filter(entity => entity.x === x && entity.y === y && entity.collides)[0];

    }
}

export class Chunk {
    tiles: Tile[][] = [];
    x: number;
    y: number;
    key: string;

    serialize(): any {

        let o = '';

        this.tiles.forEach(column => {

            column.forEach(cell => {

                o += cell.block.toString() + cell.floor.toString();

            });

            o += '/';

        });

        return { data: o, x: this.x, y: this.y, key: this.key };
    }
}

export class Tile {
    block: BlockType;
    floor: FloorType;
    health: number;

    constructor(block: BlockType, floor: FloorType, health: number = 10) {
        this.block = block;
        this.floor = floor;

        this.health = health;
    }
    
}

enum BlockType {
    null,
    tree,
    air,
    water
}

enum FloorType {
    null, 
    sand,
    grass,
    snow
}

interface Vector {
    x: number,
    y: number
}