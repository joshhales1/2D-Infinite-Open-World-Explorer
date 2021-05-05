# MMO Open World RPG API Specification 

## Communication
Uses `rfc-6455`. Implemented with [ws](https://github.com/websockets/ws) for NodeJS.

### Communication format
Uses a head and body format:

`head&key1:value1^key2:value2^`

``` 
head & 
 key1 : value ^ 
 key2 : value ^
 key3 : value ^
```

This document will use the notation `send(head: head, key1: value, key2: value)` to represent sending a message in the above specified format.

For displaying incoming data the format `head: head value, key1: [description of value (type)]`. The type is a string unless otherwise stated and is only a guide of what the client should expect. 
The client will need to parse them to the correct data types.

 Example implementation of the function can be found below.

### Initializing connection to game
1) `send(head: user_token, token: [some token])`. `some token` currently should be a random number but will be used to hold player data over server restarts later. It will also be given using another server.
2) The server will return `head: server, data: successful connection` if successful. Server will return `head: server, data: bad second auth` if the connection has already been authorized.
3) The server will also return every chunk and entity currently in usage. These are all in seperate messages. Use [Chunk format](#chunk-format) and [Entity format](#entity-format) for decoding these. 
4) The server will also return `head: you, ueid: [ueid]`. This `ueid` is the entity ID the player owned by the socket. The camera should therefore center around this entity.

### Chunk format
Chunks will either be sent to be loaded or requested to be unloaded to the client. 

#### Loading chunks
Loading chunk messages come in the format `head: load_chunk, key: [chunk key], data: [chunk data], x: [x position], y:  [y position]`. 

The chunk key should be used by the client to store chunks in a dictionary like structure so they can be updated. 
For a chunk to be updated it is just reloaded. So the chunk will be sent to be loaded again with the changes.
The chunk key is made by concatenating the x and y position of the chunk. 

##### Chunk data
The `data` in a `load_chunk` is in the format:

```
b = A block. 
f = A floor.

bfbfbfbfbfbfbfbfbfbfbfbfbfbfbfbf/
bfbfbfbfbfbfbfbfbfbfbfbfbfbfbfbf/
bfbfbfbfbfbfbfbfbfbfbfbfbfbfbfbf/
bfbfbfbfbfbfbfbfbfbfbfbfbfbfbfbf/
bfbfbfbfbfbfbfbfbfbfbfbfbfbfbfbf/
bfbfbfbfbfbfbfbfbfbfbfbfbfbfbfbf/
bfbfbfbfbfbfbfbfbfbfbfbfbfbfbfbf/
bfbfbfbfbfbfbfbfbfbfbfbfbfbfbfbf/
bfbfbfbfbfbfbfbfbfbfbfbfbfbfbfbf/
bfbfbfbfbfbfbfbfbfbfbfbfbfbfbfbf/
bfbfbfbfbfbfbfbfbfbfbfbfbfbfbfbf/
bfbfbfbfbfbfbfbfbfbfbfbfbfbfbfbf/
bfbfbfbfbfbfbfbfbfbfbfbfbfbfbfbf/
bfbfbfbfbfbfbfbfbfbfbfbfbfbfbfbf/
bfbfbfbfbfbfbfbfbfbfbfbfbfbfbfbf/
bfbfbfbfbfbfbfbfbfbfbfbfbfbfbfbf/
bfbfbfbfbfbfbfbfbfbfbfbfbfbfbfbf/
```

It is made of 16 rows of 32 characters. Each row can be split every two characters. 
The first of these split characters is the block located at that tile.
The second is the type of floor located at that tile.

#### Unloading chunks
Unloading chunk messages come in the format `head: unload_chunk, key [chunk_key]`.

The chunk key is the same key used when the chunk was loaded. Use this message to delete any loaded chunks from the clients memory. 
No block updates take place in unloaded chunks.

### Entity format

Entity messages come in the format:

```
head: entity, 
 x: [x position (number)],
 y: [y position (number)],
 ueid: [entity uid],
 facingX: [facing x (number)],
 facingY: [facing y (number)],
 dead: [dead (boolean)],
 type: [type of entity]
```

- `x position` is x the world position of the entity.
- `y position` is y the world position of the entity.
- `ueid` is the unique string which the entity has. Use this to keep entities stored in a dictionary like structure.
- `facing x` will be either -1, 0 or 1. -1 means looking left, 1 means right and 0 means indeterminate. This value should be "signed" (`Math.sign(input)` by the client).
- `facing y` will be either -1, 0 or 1. -1 means looking down, 1 means up and 0 means indeterminate. This value should be "signed" (`Math.sign(input)` by the client).
- `dead` is whether the entity is dead. This will only be ever sent once. If a entity has this field set to `true` then destroy or remove it as necessary.
- `type` is the type of entity, e.g. `player`, `villager`. The client should use this to texture the entity correctly.
All entities sent to the client should be rendered. Any invisible entities are not sent.

#### Additional fields
Entities may have additional fields depending on their `type`. These are described below.

##### Player `player`
```
head: entity
 ... entity fields,
 placing: [player placing blocks (boolean)],
 breaking: [player using tool to break (boolean)],
 attacking: [player using tool to attack (boolean)],
 name: [name]
```

- `placing` is whether or not the player is currently holding the place button. Should be used to display the correct animation.
- `breaking` is whether or not the player is currently holding the break button. Should be used to display the correct animation.
- `attacking` is whether or not the player is currently holding the attack button. Should be used to display the correct animation.
- `name` is the name of the player. Could be used to display name above player.

##### Placeholder `placeholder`

No additional fields.

### Player control
At the time of writing there are 4 distinct things a player can do.

#### Moving
To set the movement direction of the player use `send(head: mv, data: [direction])`. 
The movement direction is used to determine facing direction. This will be updated to allow clients to decide their facing direction for increased fidelity when building. 

`direction` is the direction of travel where:
- `0` is stationary
- `1` is up
- `2` is right
- `3` is down
- `4` is left

#### Placing
To place blocks in the facing direction use `send(head: place, isPlacing[start or stop(boolean)])`.

`start or stop` should be `true` to place blocks on each frame but `false` to stop placing blocks on each frame.

#### Breaking
To break blocks in the facing direction use `send(head: break, isBreaking[start or stop(boolean)])`.

`start or stop` should be `true` to break blocks on each frame but `false` to stop breaking blocks on each frame.

#### Attacking
To attacking entites in the facing direction use `send(head: attack, isAttacking[start or stop(boolean)])`.

`start or stop` should be `true` to attack on each frame but `false` to stop attacking on each frame.



