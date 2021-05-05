"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = void 0;
const crypto = require('crypto');
class Entity {
    constructor(map, type, x = 0, y = 0, visible = true, collides = true) {
        this.children = [];
        this.dead = false;
        this._health = 10;
        map.addEntity(this);
        this.map = map;
        this.type = type;
        this.ueid = crypto.randomBytes(4).toString('hex');
        this.visible = visible;
        this.collides = collides;
        this.setPosition(x, y, true);
        this.setRotation(0, 1);
    }
    get health() {
        return this._health;
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    get facingX() {
        return this._facingX;
    }
    get facingY() {
        return this._facingY;
    }
    addChild(relativeX, relativeY, fake = false) {
        let newEntity = new Entity(this.map, "fake chunk loader", this.x + relativeX, this.y + relativeY, !fake, !fake);
        this.children.push(newEntity);
        return newEntity;
    }
    setPosition(x, y, force = false) {
        let diffX = x - this.x;
        let diffY = y - this.y;
        this.setRotation(Math.sign(diffX), Math.sign(diffY));
        if (this.collides && !force) {
            if (![0, 2, 3].includes(this.map.getTile(x, y).block)) {
                return;
            }
            let notCollided = this.map.entites.every(entity => {
                if (entity === this)
                    return true;
                if (!entity.collides) { // If the other entity does not collide, then we "do"
                    return true;
                }
                if (entity.x !== x || entity.y !== y) { // If the other entity isnt't where we want to go then we "do"
                    return true;
                }
                return false; // Otherwise we fail
            });
            if (!notCollided) { // If we do collide with something return
                return;
            }
        }
        this.children.forEach(child => {
            child.setPosition(child.x + diffX, child.y + diffY);
        });
        this._x = x;
        this._y = y;
        if (this.visible)
            this.map.network.broadcast('entity', this.serialize());
    }
    setRotation(relX, relY) {
        this._facingX = relX;
        this._facingY = relY;
        if (this.visible)
            this.map.network.broadcast('entity', this.serialize());
    }
    changeHealth(by) {
        this._health += by;
        if (this.health < 1) {
            this.die();
        }
    }
    die() {
        this.dead = true;
        this.map.removeEntity(this);
        if (this.visible)
            this.map.network.broadcast('entity', this.serialize());
        this.children.forEach(child => {
            child.die();
        });
    }
    move(x, y) {
        this.setPosition(this.x + x, this.y + y);
    }
    serialize() {
        return {
            x: this.x,
            y: this.y,
            ueid: this.ueid,
            facingX: this.facingX,
            facingY: this.facingY,
            dead: this.dead,
            type: this.type
        };
    }
}
exports.Entity = Entity;
