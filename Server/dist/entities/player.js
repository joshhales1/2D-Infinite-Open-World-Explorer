"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const entity_1 = require("./entity");
const util_1 = require("util");
class Player extends entity_1.Entity {
    constructor(conn, map) {
        super(map, "player", 0, 0);
        this.moving = 0;
        this.placing = false;
        this.breaking = false;
        this.attacking = false;
        this.conn = conn;
        this.addChild(16, 0, true);
        this.addChild(-16, 0, true);
        this.addChild(0, 16, true);
        this.addChild(0, -16, true);
        this.addChild(16, 16, true);
        this.addChild(-16, -16, true);
        this.addChild(16, -16, true);
        this.addChild(-16, 16, true);
    }
    serialize() {
        let standard = super.serialize();
        standard["placing"] = this.placing;
        standard["breaking"] = this.breaking;
        standard["attacking"] = this.attacking;
        standard["name"] = this.name;
        return standard;
    }
    die() {
        this.setPosition(0, 0, true);
        this.changeHealth(-this.health + 10);
    }
    removeFromWorld() {
        super.die();
    }
    tick() {
        if (this.moving !== 0) {
            if (this.moving === 1)
                this.move(0, 1);
            if (this.moving === 2)
                this.move(1, 0);
            if (this.moving === 3)
                this.move(0, -1);
            if (this.moving === 4)
                this.move(-1, 0);
        }
        if (this.placing) {
            this.map.tryPlaceBlock(this.facingX + this.x, this.facingY + this.y, 5);
        }
        if (this.breaking) {
            this.map.tryDamageBlock(this.facingX + this.x, this.facingY + this.y, 1);
        }
        if (this.attacking) {
            let entityAtCursor = this.map.entityAtPosition(this.facingX + this.x, this.facingY + this.y);
            if (!util_1.isUndefined(entityAtCursor)) {
                entityAtCursor.changeHealth(-1);
            }
        }
    }
}
exports.Player = Player;
