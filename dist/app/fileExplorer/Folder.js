import { FSNode } from "./FSNode.js";

class Folder extends FSNode {
    constructor(name, parent) {
        super(name);
        this.parent = parent;
        this.children = [];
    }
}

export { Folder };