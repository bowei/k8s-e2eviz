namespace prefixtree {

class Node<T> {
    public children: Map<String, Node<T>>;
    public label: String;
    public parent: Node<T>;
    public data: T;
    
    constructor(label: String) {
        this.children = new Map<String, Node<T>>();
        this.label = label;
        this.parent = null;
        this.data = null;
    }
    
    addChild(label: String, child: Node<T>) {
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
    
    prefix() : String {
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
    /*
    asHTMLLI() {
        let label = this.label;
        if (this.size() > 1) {
            label +=  ' (items ' + this.size() + ')';
        }
        
        let li = ($('<li>').addClass('browser-tree-item')
        .append($('<div>')
        .html(label)
        .addClass('browser-tree-label'))
        .toggle());
        
        if (this.children.size > 0) {
            let view = $('<div>').addClass('browser-tree-item-view').html('[view]');
            li.append(view);
            view.click(() => {
                console.log('view', this);
                // XXX
                showReport(this.prefix());
                return false;
            });
        }
        
        if (this.data) {
            let data = $('<div>').addClass('browser-tree-item-data');
            li.append(data);
            data.html('[data]');
            
            data.click(() => {
                console.log('data', this);
                return false;
            });
        }
        
        li.click((event) => {
            this.children.forEach((value) => {
                value.li.toggle('fast');
            });
            return false;
        });
        
        this.li = li;
        
        if (this.children.size > 0) {
            let ul = $('<ul>').addClass('browser-tree-child-list');
            this.addChildrenLI(ul);
            li.append(ul);
        }
        return li;
    }
    
    addChildrenLI(ul) {
        Array.from(this.children.keys()).sort((a, b) => {
            return a.localeCompare(b);
        }).forEach((label) => {
            let v = this.children.get(label);
            ul.append(v.asHTMLLI());
        })
        return ul;
    }*/
}

export class Tree<T> {
    public root: Node<T>;
    
    constructor() {
        this.root = new Node<T>(null);
    }
    
    walk(fn) {
        this.root.walk(fn);
    }
    
    add(path: [String], data:T) {
        let cur = this.root;
        for (let i=0; i<path.length; ++i) {
            if (cur.children.has(path[i])) {
                cur = cur.children.get(path[i]);
            } else {
                let node = new Node<T>(path[i]);
                cur.addChild(path[i], node);
                cur = node;
            }
        }
        cur.data = data;
    }
    
    optimize() {
        this.root.optimize();
    }
    /*
    asHTMLUL() {
        let ul = $('<ul>');
        this.root.addChildrenLI(ul).addClass('browser-tree-top-list');
        this.root.children.forEach((v) => {
            v.li.toggle();
        })
        return ul;
    }*/
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

    visitChild(node: Node<T>, key: String) {
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