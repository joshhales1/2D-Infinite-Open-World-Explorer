"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tile = exports.Chunk = exports.Map = void 0;
const world_generation_1 = require("./world-generation");
const util_1 = require("util");
class Map {
    constructor(network) {
        this.editedChunks = {};
        this.chunkWidth = 16;
        this.loadedChunks = {};
        this.entites = [];
        this.worldGen = new world_generation_1.WorldGeneration(Math.random().toString(), Math.random().toString());
        this.network = network;
    }
    static getChunkKey(x, y) {
        return x.toString() + "," + y.toString();
    }
    chunkPosFromRealPos(x, y) {
        return {
            x: Math.floor(x / this.chunkWidth),
            y: Math.floor(y / this.chunkWidth)
        };
    }
    loadChunk(x, y) {
        let ck = Map.getChunkKey(x, y);
        if (!Object.keys(this.loadedChunks).includes(ck)) {
            if (Object.keys(this.editedChunks).includes(ck)) { // IF DB CONTAINS
                this.loadedChunks[ck] = this.editedChunks[ck]; // SET LOADED CHUNKS TO DB RESULT
            }
            else {
                this.loadedChunks[ck] = this.worldGen.chunk(x, y);
            }
            this.network.broadcast('load_chunk', this.loadedChunks[ck].serialize());
        }
        return this.loadedChunks[ck];
    }
    unloadChunk(x, y) {
        let ck = Map.getChunkKey(x, y);
        if (Object.keys(this.loadedChunks).includes(ck)) {
            delete this.loadedChunks[ck];
            this.network.broadcast('unload_chunk', { key: ck });
        }
    }
    editTile(x, y, newTile) {
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
        this.network.broadcast('load_chunk', this.loadedChunks[ck].serialize());
    }
    getTile(x, y) {
        let chunkCoords = this.chunkPosFromRealPos(x, y);
        let chunk = this.loadChunk(chunkCoords.x, chunkCoords.y);
        let relX = x - chunkCoords.x * this.chunkWidth;
        let relY = y - chunkCoords.y * this.chunkWidth;
        return chunk.tiles[relX][relY];
    }
    addEntity(entity) {
        this.entites.push(entity);
    }
    removeEntity(entity) {
        delete this.entites[this.entites.indexOf(entity)];
    }
    tick() {
        let chunksKeysInUse = [];
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
    sendAllChunks(conn) {
        Object.keys(this.loadedChunks).forEach(chunk => {
            conn.sendObject('load_chunk', this.loadedChunks[chunk].serialize());
        });
    }
    sendAllEntities(conn) {
        this.entites.forEach(entity => {
            if (entity.visible)
                conn.sendObject('entity', entity.serialize());
        });
    }
    tryPlaceBlock(x, y, type) {
        let oldTile = this.getTile(x, y);
        console.log("Trying to place");
        if (oldTile.block === BlockType.air && (util_1.isUndefined(this.entityAtPosition(x, y)) || this.entityAtPosition(x, y).collides === false)) {
            this.editTile(x, y, new Tile(type, oldTile.floor));
        }
    }
    tryDamageBlock(x, y, damage) {
        let oldTile = this.getTile(x, y);
        if (oldTile.block !== BlockType.air) {
            this.editTile(x, y, new Tile(oldTile.block, oldTile.floor, oldTile.health -= damage));
        }
    }
    entityAtPosition(x, y) {
        return this.entites.filter(entity => entity.x === x && entity.y === y && entity.collides)[0];
    }
}
exports.Map = Map;
class Chunk {
    constructor() {
        this.tiles = [];
    }
    serialize() {
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
exports.Chunk = Chunk;
class Tile {
    constructor(block, floor, health = 10) {
        this.block = block;
        this.floor = floor;
        this.health = health;
    }
}
exports.Tile = Tile;
var BlockType;
(function (BlockType) {
    BlockType[BlockType["null"] = 0] = "null";
    BlockType[BlockType["tree"] = 1] = "tree";
    BlockType[BlockType["air"] = 2] = "air";
    BlockType[BlockType["water"] = 3] = "water";
})(BlockType || (BlockType = {}));
var FloorType;
(function (FloorType) {
    FloorType[FloorType["null"] = 0] = "null";
    FloorType[FloorType["sand"] = 1] = "sand";
    FloorType[FloorType["grass"] = 2] = "grass";
    FloorType[FloorType["snow"] = 3] = "snow";
})(FloorType || (FloorType = {}));
