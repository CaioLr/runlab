import { FSNode } from "./FSNode.js";

class File extends FSNode {
    constructor(name, parent, ext) {
        super(name);
        this.parent = parent;
        this.content = "";
        this.ext = ext;
    }
}

export { File };