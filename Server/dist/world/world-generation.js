"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorldGeneration = void 0;
const map_1 = require("./map");
const SimplexNoise = require('simplex-noise');
class WorldGeneration {
    constructor(biomeSeed, terrainSeed) {
        this.chunkSize = 16;
        this.biomeNoise = new SmoothNoise(biomeSeed);
        this.terrainNoise = new SmoothNoise(terrainSeed);
    }
    chunk(xPosition, yPosition) {
        let returnValue = [];
        for (let x = 0; x < 16; x++) {
            returnValue.push([]);
            for (let y = 0; y < 16; y++) {
                let biomeValue = this.biomeNoise.noise(xPosition * this.chunkSize + x, yPosition * this.chunkSize + y);
                let terrainValue = this.terrainNoise.noise(xPosition * this.chunkSize + x, yPosition * this.chunkSize + y);
                let newTile = new map_1.Tile(0, 0);
                newTile.floor = 3;
                if (biomeValue < 1 / 3)
                    newTile.floor = 1;
                else if (biomeValue < 2 / 3)
                    newTile.floor = 2;
                newTile.block = 3;
                if (terrainValue < 1 / 3)
                    newTile.block = 1;
                else if (terrainValue < 2 / 3)
                    newTile.block = 2;
                returnValue[x].push(newTile);
            }
        }
        let c = new map_1.Chunk();
        c.tiles = returnValue;
        c.x = xPosition;
        c.y = yPosition;
        c.key = c.x + "," + c.y;
        return c;
    }
}
exports.WorldGeneration = WorldGeneration;
class SmoothNoise {
    constructor(seed) {
        this.simplexNoise = new SimplexNoise(seed);
    }
    noise(x, y, num_iterations = 16, persistence = 0.5, scale = 0.007, low = 0, high = 255) {
        let maxAmp = 0;
        let amp = 1;
        let freq = scale;
        let noise = 0;
        for (let i = 0; i < num_iterations; i++) {
            noise += this.simplexNoise.noise2D(x * freq, y * freq) * amp;
            maxAmp += amp;
            amp *= persistence;
            freq *= 2;
        }
        noise /= maxAmp;
        noise = noise * (high - low) / 2 + (high + low) / 2;
        return noise / 255;
    }
}
