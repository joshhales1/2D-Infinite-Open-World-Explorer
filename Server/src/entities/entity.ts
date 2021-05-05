import { Map } from '../world/map';
const crypto = require('crypto');

export class Entity {

    private _x: number;
    private _y: number;

    private _facingX: number;
    private _facingY: number;

    private ueid: string;

    private readonly type: string;

    private children: Entity[] = [];

    readonly collides: boolean;
    readonly visible: boolean;

    private dead: boolean = false;

    protected map: Map;

    private _health: number = 10;

    public get health(): number {
        return this._health;
    }

    public get x(): number {
        return this._x;
    }

    public get y(): number {
        return this._y;
    }

    public get facingX(): number {
        return this._facingX;
    }

    public get facingY(): number {
        return this._facingY;
    }

    constructor(map: Map, type: string, x: number = 0, y: number = 0, visible = true, collides = true) {

        map.addEntity(this);

        this.map = map;

        this.type = type;

        this.ueid = crypto.randomBytes(4).toString('hex');

        this.visible = visible;
        this.collides = collides;

        this.setPosition(x, y, true);
        this.setRotation(0 , 1);
                 
    }

    addChild(relativeX: number, relativeY: number, fake = false): Entity {

        let newEntity = new Entity(this.map, "fake chunk loader", this.x + relativeX, this.y + relativeY, !fake, !fake);        

        this.children.push(newEntity);

        return newEntity;
    }

    setPosition(x: number, y: number, force: boolean = false) {

        let diffX = x - this.x;
        let diffY = y - this.y;

        this.setRotation(Math.sign(diffX), Math.sign(diffY));        

        if (this.collides && !force) {

            if (![0, 2, 3].includes(this.map.getTile(x, y).block)) {
                return;
            }

            let notCollided = this.map.entites.every(entity => { // Returns true when do not collide with anything

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

    setRotation(relX: number, relY: number) {
        this._facingX = relX;
        this._facingY = relY;

        if (this.visible)
            this.map.network.broadcast('entity', this.serialize());
    }

    changeHealth(by: number) {
        this._health += by;

        if (this.health < 1) {
            this.die();
        }
    }

    die(): void {
        this.dead = true;
        this.map.removeEntity(this);

        if (this.visible)
            this.map.network.broadcast('entity', this.serialize());

        this.children.forEach(child => {
            child.die();
        });

    }

    move(x: number, y: number) {
        this.setPosition(this.x + x, this.y + y);
    }

    serialize(): any {

        return {
            x: this.x,
            y: this.y,
            ueid: this.ueid,
            facingX: this.facingX,
            facingY: this.facingY,
            dead: this.dead,
            type: this.type
        }
    }
}