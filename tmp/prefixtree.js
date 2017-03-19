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

    optimize() {
        console.log('optimize', this);

        
        this.children.forEach((value) => {
            value.optimize();
        })

        if (this.children.size == 1 && !this.data && this.parent) {
            var child = Array.from(this.children.values())[0];
            console.log('optimize child', child);
            this.parent.children.delete(this.label);
            // Pull the child node into this node.
            this.children = child.children;
            this.label += (' ' + child.label);
            this.parent.children.set(this.label, this);
            this.data = child.data;
        }
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

console.log(splitTestDescription('a common be should bold'));

var pt = new PrefixTree();
pt.add(['a', 'b', 'x'], 'xxx');
pt.add(['a', 'b', 'y'], 'yyy');
pt.add(['d', 'e'], 'zzz');

pt.walk((parent, node) => {
    console.log('walk', node);
});

pt.optimize();
console.log('---');
pt.walk((parent, node) => {
    console.log('walk', node);
});
