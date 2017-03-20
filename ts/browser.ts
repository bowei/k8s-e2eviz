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
/// <reference path="../node_modules/@types/jquery/index.d.ts" />

namespace browser {

class Visitor extends prefixtree.Visitor<string> {
    public ul : JQuery;

    constructor(private prefix: string, tree: prefixtree.Tree<string>) {
        super(tree);
        this.ul = $('<ul>')
            .addClass('browser-tree-list')
            .addClass('browser-tree-list-top');
    }

    visitNode(node: prefixtree.Node<string>) {
        if (node.data || node.children.size > 0) {
            let oldUL = this.ul;

            this.ul = $('<ul>')
                .addClass('browser-tree-list')
                .attr('id', this.childrenId(node));
            oldUL.append(this.ul);

            if (node.data) {
                this.ul.append($('<li>')
                    .html(node.data)
                    .addClass('browser-tree-item-data'));
            }

            super.visitNode(node); 
            this.ul = oldUL;
        }
    }

    visitChild(node: prefixtree.Node<string>, key: string) {
        let li = $('<li>');
        this.ul.append(li);

        li.addClass('browser-tree-item');
        li.attr('id', this.nodeId(node));

        let label = node.label;
        if (node.size() > 1) {
            label += ' (' + node.size() + ' items)';
        }

        let target = '#' + this.childrenId(node);
        console.log(target);

        li.append($('<div>')
            .html(label)
            .addClass('browser-tree-label')
            .click(() => {
                console.log('xxx', target);
                $(target).toggle('fast');
                return false;
            }));

        super.visitChild(node, key);
    }

    private nodeId(node: prefixtree.Node<string>): string {
        return this.prefix+node.uid;
    }

    private childrenId(node: prefixtree.Node<string>): string {
        return this.prefix+'children-'+node.uid;
    }
}

export function makeTree(tree: prefixtree.Tree<string>) : JQuery {
    let v = new Visitor('x-', tree);
    v.visit();
    return v.ul;
}

export class Browser {
    /** Collapse the entire tree down the root. */
    collapse() {

    }

    /** Expand the tree revealing the given path. */
    expand(path: [string]) {

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
}

asHTMLUL() {
    let ul = $('<ul>');
    this.root.addChildrenLI(ul).addClass('browser-tree-top-list');
    this.root.children.forEach((v) => {
        v.li.toggle();
    })
    return ul;
}
*/
} // namespace