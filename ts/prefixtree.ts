/*
Copyright 2017 The Kubernetes Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
namespace prefixtree {

export class Node<T> {
    public children: Map<string, Node<T>>;
    public parent: Node<T>;
    public data: T;
    
    constructor(public uid: number, public label: string) {
        this.children = new Map<string, Node<T>>();
        this.parent = null;
        this.data = null;
    }
    
    addChild(label: string, child: Node<T>) {
        child.parent = this;
        this.children.set(label, child);
    }
    
    walk(fn : (node: Node<T>) => void) {
        fn(this);
        this.children.forEach((value) => {
            value.walk(fn);
        });
    }
    
    fold<V>(val: V, fn: (val: V, node: Node<T>) => V) {
        val = fn(val, this);
        this.children.forEach((node) => {
            val = node.fold(val, fn);
        });
        return val;
    }
    
    prefix() : string {
        let prefix = this.label;
        let cur = this.parent;
        
        while (cur && cur.label) {
            prefix = cur.label + ' ' + prefix;
            cur = cur.parent;
        }
        
        return prefix;
    }
    
    size() : number {
        return this.fold(0, (val, node) => {
            return val + (node.data ? 1 : 0);
        });
    }
    
    // optimize reduces the size and depth of the tree.
    // - removes singleton children.
    optimize() {
        this.children.forEach((value) => {
            value.optimize();
        })
        
        if (this.children.size == 1 && !this.data && this.parent) {
            let child = Array.from(this.children.values())[0];
            
            this.parent.children.delete(this.label);
            
            // Pull the child node into this node.
            this.children = child.children;
            this.children.forEach((v) => {
                v.parent = this;
            });
            
            this.label = this.label + ' ' + child.label;
            this.parent.children.set(this.label, this);
            this.data = child.data;
        }
    }
}

export class Tree<T> {
    public root: Node<T>;
    private nextUID: number;

    constructor() {
        this.root = new Node<T>(0, null);
        this.nextUID = 1;
    }
    
    walk(fn) {
        this.root.walk(fn);
    }
    
    add(path: [string], data:T) {
        let cur = this.root;
        for (let i=0; i<path.length; ++i) {
            if (cur.children.has(path[i])) {
                cur = cur.children.get(path[i]);
            } else {
                let node = new Node<T>(this.nextUID, path[i]);
                this.nextUID++;
                cur.addChild(path[i], node);
                cur = node;
            }
        }
        cur.data = data;
    }
    
    optimize() {
        this.root.optimize();
    }
}

/**
 * Visitor class for the nodes. Override methods to change iteration method actions.
 */
export class Visitor<T> {
    constructor(public tree: Tree<T>) {
    }

    visit() {
        this.visitNode(this.tree.root);
    }

    visitNode(node: Node<T>) {
        node.children.forEach((child, key) => {
            this.visitChild(child, key);
        });
    }

    visitChild(node: Node<T>, key: string) {
        this.visitNode(node);
    }
}

export class PrintVisitor<T> extends Visitor<T> {
    visitNode(node) {
        console.log(node);
        super.visitNode(node);
    }
}

} // namespace