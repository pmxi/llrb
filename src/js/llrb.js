// Left-Leaning Red-Black Tree Implementation with Execution Tracking

const RED = true;
const BLACK = false;

class Node {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
        this.color = RED;
    }
}

class ExecutionTracer {
    constructor() {
        this.steps = [];
        this.callStack = [];
    }

    pushCall(funcName, params) {
        this.callStack.push({ funcName, params });
    }

    popCall() {
        this.callStack.pop();
    }

    addStep(funcName, lineNumber, variables, treeState) {
        this.steps.push({
            funcName,
            lineNumber,
            callStack: [...this.callStack],
            variables: { ...variables },
            treeState: JSON.parse(JSON.stringify(treeState))
        });
    }

    reset() {
        this.steps = [];
        this.callStack = [];
    }
}

class LLRBTree {
    constructor() {
        this.root = null;
        this.tracer = new ExecutionTracer();
    }

    // Helper: Check if node is red
    isRed(node) {
        if (node === null) return false;
        return node.color === RED;
    }

    // Insert operation
    insert(key) {
        this.tracer.reset();
        this.tracer.addStep('insert', -1, { key }, this.serializeTree());

        this.root = this.insertRecursive(this.root, key);
        this.root.color = BLACK;

        this.tracer.addStep('insert', -1, { key, result: 'complete' }, this.serializeTree());
        return this.tracer.steps;
    }

    insertRecursive(h, key) {
        const funcName = 'insert';
        this.tracer.pushCall(funcName, { h: h?.value, key });

        // Line 0: function declaration
        this.tracer.addStep(funcName, 0, { h: h?.value, key }, this.serializeTree());

        // Line 2: if (h == null) return new Node(key, val, RED);
        this.tracer.addStep(funcName, 2, { h: h?.value, key }, this.serializeTree());
        if (h === null) {
            const newNode = new Node(key);
            this.tracer.addStep(funcName, 2, { h: null, key, result: 'new node' }, this.serializeTree());
            this.tracer.popCall();
            return newNode;
        }

        // Line 4-6: comparison and recursive calls
        this.tracer.addStep(funcName, 4, { h: h.value, key }, this.serializeTree());
        const cmp = key - h.value;

        if (cmp < 0) {
            this.tracer.addStep(funcName, 5, { h: h.value, key, cmp: '<' }, this.serializeTree());
            h.left = this.insertRecursive(h.left, key);
        } else if (cmp > 0) {
            this.tracer.addStep(funcName, 6, { h: h.value, key, cmp: '>' }, this.serializeTree());
            h.right = this.insertRecursive(h.right, key);
        } else {
            this.tracer.addStep(funcName, 7, { h: h.value, key, cmp: '=' }, this.serializeTree());
        }

        // Line 9: if (isRed(h.right) && !isRed(h.left)) h = rotateLeft(h);
        this.tracer.addStep(funcName, 9, { h: h.value }, this.serializeTree());
        if (this.isRed(h.right) && !this.isRed(h.left)) {
            h = this.rotateLeft(h);
        }

        // Line 10: if (isRed(h.left) && isRed(h.left.left)) h = rotateRight(h);
        this.tracer.addStep(funcName, 10, { h: h.value }, this.serializeTree());
        if (this.isRed(h.left) && h.left && this.isRed(h.left.left)) {
            h = this.rotateRight(h);
        }

        // Line 11: if (isRed(h.left) && isRed(h.right)) colorFlip(h);
        this.tracer.addStep(funcName, 11, { h: h.value }, this.serializeTree());
        if (this.isRed(h.left) && this.isRed(h.right)) {
            this.colorFlip(h);
        }

        // Line 13: return h;
        this.tracer.addStep(funcName, 13, { h: h.value, result: 'return' }, this.serializeTree());
        this.tracer.popCall();
        return h;
    }

    // Delete minimum
    deleteMin() {
        this.tracer.reset();

        if (this.root === null) {
            this.tracer.addStep('deleteMin', -1, { error: 'empty tree' }, this.serializeTree());
            return this.tracer.steps;
        }

        this.tracer.addStep('deleteMin', -1, {}, this.serializeTree());

        if (!this.isRed(this.root.left) && !this.isRed(this.root.right)) {
            this.root.color = RED;
        }

        this.root = this.deleteMinRecursive(this.root);

        if (this.root !== null) {
            this.root.color = BLACK;
        }

        this.tracer.addStep('deleteMin', -1, { result: 'complete' }, this.serializeTree());
        return this.tracer.steps;
    }

    deleteMinRecursive(h) {
        const funcName = 'deleteMin';
        this.tracer.pushCall(funcName, { h: h?.value });

        // Line 0: function declaration
        this.tracer.addStep(funcName, 0, { h: h?.value }, this.serializeTree());

        // Line 2: if (h.left == null) return null;
        this.tracer.addStep(funcName, 2, { h: h.value, leftNull: h.left === null }, this.serializeTree());
        if (h.left === null) {
            this.tracer.popCall();
            return null;
        }

        // Line 4-5: if (!isRed(h.left) && !isRed(h.left.left)) h = moveRedLeft(h);
        this.tracer.addStep(funcName, 4, { h: h.value }, this.serializeTree());
        if (!this.isRed(h.left) && !this.isRed(h.left.left)) {
            this.tracer.addStep(funcName, 5, { h: h.value, action: 'moveRedLeft' }, this.serializeTree());
            h = this.moveRedLeft(h);
        }

        // Line 7: h.left = deleteMin(h.left);
        this.tracer.addStep(funcName, 7, { h: h.value }, this.serializeTree());
        h.left = this.deleteMinRecursive(h.left);

        // Line 9: return fixUp(h);
        this.tracer.addStep(funcName, 9, { h: h.value }, this.serializeTree());
        const result = this.fixUp(h);

        this.tracer.popCall();
        return result;
    }

    // Delete operation
    delete(key) {
        this.tracer.reset();

        if (this.root === null) {
            this.tracer.addStep('delete', -1, { error: 'empty tree' }, this.serializeTree());
            return this.tracer.steps;
        }

        if (!this.contains(key)) {
            this.tracer.addStep('delete', -1, { error: 'key not found', key }, this.serializeTree());
            return this.tracer.steps;
        }

        this.tracer.addStep('delete', -1, { key }, this.serializeTree());

        if (!this.isRed(this.root.left) && !this.isRed(this.root.right)) {
            this.root.color = RED;
        }

        this.root = this.deleteRecursive(this.root, key);

        if (this.root !== null) {
            this.root.color = BLACK;
        }

        this.tracer.addStep('delete', -1, { key, result: 'complete' }, this.serializeTree());
        return this.tracer.steps;
    }

    deleteRecursive(h, key) {
        const funcName = 'delete';
        this.tracer.pushCall(funcName, { h: h?.value, key });

        this.tracer.addStep(funcName, 0, { h: h.value, key }, this.serializeTree());

        const cmp = key - h.value;

        // Line 2: if (key.compareTo(h.key) < 0)
        this.tracer.addStep(funcName, 2, { h: h.value, key, cmp }, this.serializeTree());

        if (cmp < 0) {
            // Line 4-6
            this.tracer.addStep(funcName, 4, { h: h.value }, this.serializeTree());
            if (!this.isRed(h.left) && h.left && !this.isRed(h.left.left)) {
                this.tracer.addStep(funcName, 5, { h: h.value }, this.serializeTree());
                h = this.moveRedLeft(h);
            }
            this.tracer.addStep(funcName, 6, { h: h.value }, this.serializeTree());
            h.left = this.deleteRecursive(h.left, key);
        } else {
            // Line 10: if (isRed(h.left)) h = rotateRight(h);
            this.tracer.addStep(funcName, 10, { h: h.value }, this.serializeTree());
            if (this.isRed(h.left)) {
                this.tracer.addStep(funcName, 11, { h: h.value }, this.serializeTree());
                h = this.rotateRight(h);
            }

            // Line 12: if (key.compareTo(h.key) == 0 && h.right == null)
            this.tracer.addStep(funcName, 12, { h: h.value, key }, this.serializeTree());
            if (cmp === 0 && h.right === null) {
                this.tracer.addStep(funcName, 13, { h: h.value }, this.serializeTree());
                this.tracer.popCall();
                return null;
            }

            // Line 14: if (!isRed(h.right) && !isRed(h.right.left))
            this.tracer.addStep(funcName, 14, { h: h.value }, this.serializeTree());
            if (h.right && !this.isRed(h.right) && !this.isRed(h.right.left)) {
                this.tracer.addStep(funcName, 15, { h: h.value }, this.serializeTree());
                h = this.moveRedRight(h);
            }

            // Line 16: if (key.compareTo(h.key) == 0)
            this.tracer.addStep(funcName, 16, { h: h.value, key }, this.serializeTree());
            if (key === h.value) {
                const minNode = this.minNode(h.right);
                this.tracer.addStep(funcName, 18, { h: h.value, minKey: minNode.value }, this.serializeTree());
                h.value = minNode.value;
                this.tracer.addStep(funcName, 20, { h: h.value }, this.serializeTree());
                h.right = this.deleteMinRecursive(h.right);
            } else {
                this.tracer.addStep(funcName, 22, { h: h.value }, this.serializeTree());
                h.right = this.deleteRecursive(h.right, key);
            }
        }

        // Line 24: return fixUp(h);
        this.tracer.addStep(funcName, 24, { h: h.value }, this.serializeTree());
        const result = this.fixUp(h);

        this.tracer.popCall();
        return result;
    }

    // Helper functions
    rotateLeft(h) {
        this.tracer.pushCall('rotateLeft', { h: h.value });
        this.tracer.addStep('rotateLeft', 0, { h: h.value }, this.serializeTree());

        // Line 2: Node x = h.right;
        this.tracer.addStep('rotateLeft', 2, { h: h.value }, this.serializeTree());
        const x = h.right;

        // Line 3: h.right = x.left;
        this.tracer.addStep('rotateLeft', 3, { h: h.value, x: x.value }, this.serializeTree());
        h.right = x.left;
        this.tracer.addStep('rotateLeft', 3, { h: h.value, x: x.value }, this.serializeTree());

        // Line 4: x.left = h;
        this.tracer.addStep('rotateLeft', 4, { h: h.value, x: x.value }, this.serializeTree());
        x.left = h;
        this.tracer.addStep('rotateLeft', 4, { h: h.value, x: x.value }, this.serializeTree());

        // Line 5: x.color = h.color;
        this.tracer.addStep('rotateLeft', 5, { h: h.value, x: x.value }, this.serializeTree());
        x.color = h.color;

        // Line 6: h.color = RED;
        this.tracer.addStep('rotateLeft', 6, { h: h.value, x: x.value }, this.serializeTree());
        h.color = RED;

        // Line 7: return x;
        this.tracer.addStep('rotateLeft', 7, { h: h.value, x: x.value, result: x.value }, this.serializeTree());
        this.tracer.popCall();
        return x;
    }

    rotateRight(h) {
        this.tracer.pushCall('rotateRight', { h: h.value });
        this.tracer.addStep('rotateRight', 0, { h: h.value }, this.serializeTree());

        // Line 2: Node x = h.left;
        this.tracer.addStep('rotateRight', 2, { h: h.value }, this.serializeTree());
        const x = h.left;

        // Line 3: h.left = x.right;
        this.tracer.addStep('rotateRight', 3, { h: h.value, x: x.value }, this.serializeTree());
        h.left = x.right;
        this.tracer.addStep('rotateRight', 3, { h: h.value, x: x.value }, this.serializeTree());

        // Line 4: x.right = h;
        this.tracer.addStep('rotateRight', 4, { h: h.value, x: x.value }, this.serializeTree());
        x.right = h;
        this.tracer.addStep('rotateRight', 4, { h: h.value, x: x.value }, this.serializeTree());

        // Line 5: x.color = h.color;
        this.tracer.addStep('rotateRight', 5, { h: h.value, x: x.value }, this.serializeTree());
        x.color = h.color;

        // Line 6: h.color = RED;
        this.tracer.addStep('rotateRight', 6, { h: h.value, x: x.value }, this.serializeTree());
        h.color = RED;

        // Line 7: return x;
        this.tracer.addStep('rotateRight', 7, { h: h.value, x: x.value, result: x.value }, this.serializeTree());
        this.tracer.popCall();
        return x;
    }

    colorFlip(h) {
        this.tracer.pushCall('colorFlip', { h: h.value });
        this.tracer.addStep('colorFlip', 0, { h: h.value }, this.serializeTree());

        // Line 2: h.color = !h.color;
        this.tracer.addStep('colorFlip', 2, { h: h.value }, this.serializeTree());
        h.color = !h.color;
        this.tracer.addStep('colorFlip', 2, { h: h.value }, this.serializeTree());

        // Line 3: h.left.color = !h.left.color;
        this.tracer.addStep('colorFlip', 3, { h: h.value }, this.serializeTree());
        h.left.color = !h.left.color;
        this.tracer.addStep('colorFlip', 3, { h: h.value }, this.serializeTree());

        // Line 4: h.right.color = !h.right.color;
        this.tracer.addStep('colorFlip', 4, { h: h.value }, this.serializeTree());
        h.right.color = !h.right.color;
        this.tracer.addStep('colorFlip', 4, { h: h.value }, this.serializeTree());

        this.tracer.popCall();
    }

    moveRedLeft(h) {
        this.tracer.pushCall('moveRedLeft', { h: h.value });
        this.tracer.addStep('moveRedLeft', 0, { h: h.value }, this.serializeTree());

        // Line 2: colorFlip(h);
        this.tracer.addStep('moveRedLeft', 2, { h: h.value }, this.serializeTree());
        this.colorFlip(h);

        // Line 3: if (isRed(h.right.left))
        this.tracer.addStep('moveRedLeft', 3, { h: h.value }, this.serializeTree());
        if (h.right && this.isRed(h.right.left)) {
            // Line 5: h.right = rotateRight(h.right);
            this.tracer.addStep('moveRedLeft', 5, { h: h.value }, this.serializeTree());
            h.right = this.rotateRight(h.right);

            // Line 6: h = rotateLeft(h);
            this.tracer.addStep('moveRedLeft', 6, { h: h.value }, this.serializeTree());
            h = this.rotateLeft(h);

            // Line 7: colorFlip(h);
            this.tracer.addStep('moveRedLeft', 7, { h: h.value }, this.serializeTree());
            this.colorFlip(h);
        }

        // Line 9: return h;
        this.tracer.addStep('moveRedLeft', 9, { h: h.value }, this.serializeTree());
        this.tracer.popCall();
        return h;
    }

    moveRedRight(h) {
        this.tracer.pushCall('moveRedRight', { h: h.value });
        this.tracer.addStep('moveRedRight', 0, { h: h.value }, this.serializeTree());

        // Line 2: colorFlip(h);
        this.tracer.addStep('moveRedRight', 2, { h: h.value }, this.serializeTree());
        this.colorFlip(h);

        // Line 3: if (isRed(h.left.left))
        this.tracer.addStep('moveRedRight', 3, { h: h.value }, this.serializeTree());
        if (h.left && this.isRed(h.left.left)) {
            // Line 5: h = rotateRight(h);
            this.tracer.addStep('moveRedRight', 5, { h: h.value }, this.serializeTree());
            h = this.rotateRight(h);

            // Line 6: colorFlip(h);
            this.tracer.addStep('moveRedRight', 6, { h: h.value }, this.serializeTree());
            this.colorFlip(h);
        }

        // Line 8: return h;
        this.tracer.addStep('moveRedRight', 8, { h: h.value }, this.serializeTree());
        this.tracer.popCall();
        return h;
    }

    fixUp(h) {
        this.tracer.pushCall('fixUp', { h: h.value });
        this.tracer.addStep('fixUp', 0, { h: h.value }, this.serializeTree());

        // Line 2: if (isRed(h.right)) h = rotateLeft(h);
        this.tracer.addStep('fixUp', 2, { h: h.value }, this.serializeTree());
        if (this.isRed(h.right)) {
            h = this.rotateLeft(h);
        }

        // Line 4: if (isRed(h.left) && isRed(h.left.left))
        this.tracer.addStep('fixUp', 4, { h: h.value }, this.serializeTree());
        if (this.isRed(h.left) && h.left && this.isRed(h.left.left)) {
            // Line 5: h = rotateRight(h);
            this.tracer.addStep('fixUp', 5, { h: h.value }, this.serializeTree());
            h = this.rotateRight(h);
        }

        // Line 7: if (isRed(h.left) && isRed(h.right))
        this.tracer.addStep('fixUp', 7, { h: h.value }, this.serializeTree());
        if (this.isRed(h.left) && this.isRed(h.right)) {
            // Line 8: colorFlip(h);
            this.tracer.addStep('fixUp', 8, { h: h.value }, this.serializeTree());
            this.colorFlip(h);
        }

        // Line 10: return h;
        this.tracer.addStep('fixUp', 10, { h: h.value }, this.serializeTree());
        this.tracer.popCall();
        return h;
    }

    // Helper: Find minimum node
    minNode(node) {
        if (node.left === null) return node;
        return this.minNode(node.left);
    }

    // Helper: Check if value exists
    contains(value) {
        return this.search(this.root, value) !== null;
    }

    search(node, value) {
        if (node === null) return null;
        if (value < node.value) return this.search(node.left, value);
        if (value > node.value) return this.search(node.right, value);
        return node;
    }

    // Serialize tree for visualization
    serializeTree() {
        return this.serializeNode(this.root);
    }

    serializeNode(node) {
        if (node === null) return null;
        return {
            value: node.value,
            color: node.color ? 'red' : 'black',
            left: this.serializeNode(node.left),
            right: this.serializeNode(node.right)
        };
    }

    // Get tree statistics
    getStats() {
        return {
            nodeCount: this.countNodes(this.root),
            height: this.height(this.root)
        };
    }

    countNodes(node) {
        if (node === null) return 0;
        return 1 + this.countNodes(node.left) + this.countNodes(node.right);
    }

    height(node) {
        if (node === null) return 0;
        return 1 + Math.max(this.height(node.left), this.height(node.right));
    }

    // Clear the tree
    clear() {
        this.root = null;
        this.tracer.reset();
    }
}
