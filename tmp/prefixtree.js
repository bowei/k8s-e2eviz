class Node {
    constructor(label) {
        this.children = new Map();
        this.label = label;
        this.parent = null;
        this.data = null;

        this.li = null;
    }

    addChild(label, child) {
        child.parent = this;
        this.children.set(label, child);
    }

    // walk(parent, node)
    walk(fn) {
        fn(this.parent, this);
        this.children.forEach((value, key) => {
            value.walk(fn);
        });
    }

    // fn (val, node): val
    fold(val, fn) {
        val = fn(val, this);
        this.children.forEach((node) => {
            val = node.fold(val, fn);
        });
        return val;
    }

    size() {
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
            var child = Array.from(this.children.values())[0];

            this.parent.children.delete(this.label);
            // Pull the child node into this node.
            this.children = child.children;
            this.label += (' ' + child.label);
            this.parent.children.set(this.label, this);
            this.data = child.data;
        }
    }

    asHTMLLI() {
        var label = this.label;
        if (this.size() > 1) {
            label +=  ' (items ' + this.size() + ')';
        }

        var li = ($('<li>').addClass('browser-tree-item')
            .append($('<div>')
            .html(label)
            .addClass('browser-tree-label'))
            .toggle());

        li.dblclick((event) => {
            this.children.forEach((value) => {
                value.li.toggle('fast');
            });
            return false;
        });

        this.li = li;

        if (this.children.size > 0) {
            var ul = $('<ul>').addClass('browser-tree-child-list');
            this.addChildrenLI(ul);
            li.append(ul);
        }
        return li;
    }

    addChildrenLI(ul) {
        Array.from(this.children.keys()).sort((a, b) => {
            return a.localeCompare(b);
        }).forEach((label) => {
            var v = this.children.get(label);
            ul.append(v.asHTMLLI());
        })
        return ul;
    }
}

class PrefixTree {
    constructor() {
        this.root = new Node(-1, 'root');
    }

    // fn : (Node parent, string, Node)
    walk(fn) {
        this.root.walk(fn);
    }

    add(path, data, todo) { // XXX/bowei -- todo
        var cur = this.root;
        for (var i=0; i<path.length; ++i) {
            if (cur.children.has(path[i])) {
                cur = cur.children.get(path[i]);
            } else {
                var node = new Node(path[i]);
                cur.addChild(path[i], node);
                cur = node;
            }
        }
        cur.data = data;
    }

    optimize() {
        this.root.optimize();
    }

    asHTMLUL() {
        var ul = $('<ul>');
        this.root.addChildrenLI(ul).addClass('browser-tree-top-list');
        this.root.children.forEach((v) => {
            v.li.toggle();
        })
        return ul;
    }
}

const STOP_WORDS = [
    'a',
    'be',
    'for',
    'have',
    'not',
    'should',
    'that',
    'the',
    'with',
]

// split a test description string.
function splitTestDescription(desc) {
    var l = desc.split(/\s+/);
    var cur = [];
    var ret = [];

    for (var i=0; i<l.length; ++i) {
        cur.push(l[i]);
        if (STOP_WORDS.indexOf(l[i]) < 0) {
            ret.push(cur.join(' '));
            cur = [];
        }
    }

    return ret;
}

var pt = new PrefixTree();

for (var i=0; i<50; ++i) {
    var pathLen = Math.random() * 5 | 0 + 5;
    var path = []
    for (var k=0; k<pathLen; ++k) {
        path.push(['a', 'b', 'c', 'd'][Math.random() * 4 | 0]);
    }
    pt.add(path, 'xxx'+i);
}

pt.optimize();

$('#browserRegion').append(pt.asHTMLUL());
