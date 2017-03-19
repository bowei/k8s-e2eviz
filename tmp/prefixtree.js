class Node {
    constructor(label) {
        this.children = new Map();
        this.label = label;
        this.parent = null;
        this.data = null;
    }

    addChild(label, child) {
        child.parent = this;
        this.children.set(label, child);
    }

    walk(fn) {
        fn(this.parent, this);
        this.children.forEach((value, key) => {
            value.walk(fn);
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
        var li = $('<li>').addClass('browser-tree-item').append(
            $('<div>').html(this.label).addClass('browser-tree-label'));

        if (this.children.size > 0) {
            var ul = $('<ul>').addClass('browser-tree-child-list');
            this.addChildrenLI(ul);
            li.append(ul);
        }
        return li;
    }

    addChildrenLI(ul) {
        this.children.forEach((v, k) => {
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
        return this.root.addChildrenLI($('<ul>')).addClass('browser-tree-top-list');
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