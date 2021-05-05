"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function l(s, level = "default") {
    console.log(new Date().toUTCString() + " " + s + " [" + level + "]");
}
exports.default = l;
