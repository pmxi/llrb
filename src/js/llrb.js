/**
 * Left-Leaning Red-Black Tree Implementation with Execution Tracking
 *
 * This file implements Sedgewick's LLRB tree algorithms with execution tracing.
 * The key innovation: while the tree operations execute normally, we capture
 * snapshots at each significant step to enable step-by-step visualization.
 *
 * Architecture:
 * 1. Real tree operations execute and modify the tree structure
 * 2. ExecutionTracer records each step with line numbers matching algorithms.js
 * 3. Each step includes: tree snapshot, variables, call stack, detached nodes
 * 4. Steps array is returned to UI for playback/stepping
 */

// Colors are now strings: 'red' and 'black'
// Nodes are stored in the Heap class with explicit IDs

/**
 * Execution tracer captures step-by-step algorithm execution.
 *
 * How it works:
 * - Before each significant operation, call addStep() with current state
 * - Line numbers in addStep() correspond to lines in ALGORITHMS (algorithms.js)
 * - Each step captures: algorithm name, line number, variables, tree snapshot
 * - The array of steps is returned to UI for visualization
 *
 * Example flow for insert(5):
 *   addStep('insert', 0, {key:5, h:3}, treeSnapshot1)  <- Line 0: function entry
 *   addStep('insert', 2, {key:5, h:3}, treeSnapshot2)  <- Line 2: null check
 *   addStep('insert', 4, {key:5, h:3}, treeSnapshot3)  <- Line 4: comparison
 *   ... more steps as recursion proceeds
 */
class ExecutionTracer {
    constructor() {
        /** @type {Array<ExecutionStep>} Array of captured execution steps */
        this.steps = [];
    }

    /**
     * Record an execution step (this is the core of the stepping system!)
     *
     * Each step represents one line of the algorithm executing. The lineNumber
     * parameter must match the line number in ALGORITHMS[funcName] so the UI
     * can highlight the correct line of pseudocode.
     *
     * @param {string} funcName - Algorithm name (must match key in ALGORITHMS)
     * @param {number} lineNumber - Line number in the algorithm (0-indexed)
     * @param {Object} variables - Current variable values (e.g., {h: "n5", key: 3})
     * @param {Object} heapSnapshot - Complete heap snapshot (all nodes by ID)
     * @param {Object} contextSnapshot - Execution context (global root + stack frames)
     *
     * @typedef {Object} ExecutionStep
     * @property {string} funcName - Which algorithm is executing
     * @property {number} lineNumber - Which line (for highlighting in UI)
     * @property {Object} variables - Variable values at this moment
     * @property {Object} heap - Complete memory state (all nodes)
     * @property {Object} context - Execution context (global root + stack with local vars)
     */
    addStep(funcName, lineNumber, variables, heapSnapshot, contextSnapshot) {
        this.steps.push({
            funcName,
            lineNumber,
            variables: { ...variables },
            heap: heapSnapshot,
            context: contextSnapshot
        });
    }

    /**
     * Clear all steps (called before each new operation)
     */
    reset() {
        this.steps = [];
    }
}

/**
 * Left-Leaning Red-Black Tree with execution tracing.
 *
 * This class implements Sedgewick's LLRB tree algorithms. Each operation
 * (insert, delete, deleteMin) executes normally but also records execution
 * steps that can be played back for visualization.
 *
 * Key methods return Array<ExecutionStep> for UI visualization.
 */
class LLRBTree {
    constructor() {
        /** @type {Heap} Explicit memory model for all nodes */
        this.heap = new Heap();
        /** @type {ExecutionContext} Tracks global root and call stack */
        this.context = new ExecutionContext();
        /** @type {ExecutionTracer} Captures execution steps for visualization */
        this.tracer = new ExecutionTracer();
    }

    /**
     * Helper: Capture an execution step with heap and context snapshots
     * @param {string} funcName - Function name
     * @param {number} lineNumber - Line number in algorithm
     * @param {Object} variables - Variable values for display
     */
    captureStep(funcName, lineNumber, variables) {
        this.tracer.addStep(
            funcName,
            lineNumber,
            variables,
            this.heap.snapshot(),
            this.context.snapshot()
        );
    }

    /**
     * Check if a node is red (null nodes are considered black)
     * @param {string|null} nodeId - Node ID to check
     * @returns {boolean} True if node exists and is red
     */
    isRed(nodeId) {
        const node = this.heap.get(nodeId);
        return node && node.color === 'red';
    }

    /**
     * Insert a value into the tree and return execution steps.
     *
     * This is the public API method. It:
     * 1. Resets the tracer (clears previous steps)
     * 2. Calls the recursive insert implementation
     * 3. Ensures root is black (LLRB invariant)
     * 4. Returns array of execution steps for UI playback
     *
     * @param {number} key - Value to insert
     * @returns {Array<ExecutionStep>} Execution steps for visualization
     *
     * @example
     * const steps = tree.insert(5);
     * // Returns: [{funcName:'insert', lineNumber:0, ...}, {funcName:'insert', lineNumber:2, ...}, ...]
     * // UI can now step through these to show algorithm execution
     */
    insert(key) {
        this.tracer.reset();

        // Line 2: root = insert(root, key, val);
        this.captureStep('insertPublic', 2, { key });
        this.context.globalRootId = this.insertRecursive(this.context.globalRootId, key);

        // Line 3: root.color = BLACK;
        this.captureStep('insertPublic', 3, { key });
        const root = this.heap.get(this.context.globalRootId);
        root.color = 'black';
        this.heap.set(this.context.globalRootId, root);
        this.captureStep('insertPublic', 3, { key, result: 'complete' });

        return this.tracer.steps;
    }

    insertRecursive(hId, key) {
        const funcName = 'insert';
        this.context.pushFrame(funcName, { h: hId, key });
        this.context.setLocalVar('h', hId);

        // Line 2: if (h == null)
        this.captureStep(funcName, 2, { h: hId, key });
        if (hId === null) {
            // Line 3: return new Node(key, val, RED);
            const newId = this.heap.allocate(key, 'red');
            this.captureStep(funcName, 3, { h: null, key, result: newId });
            this.context.popFrame();
            return newId;
        }

        let h = this.heap.get(hId);

        // Line 5: if (key < h.key)
        this.captureStep(funcName, 5, { h: hId, key });

        if (key < h.value) {
            // Line 6: h.left = insert(h.left, key, val);
            this.captureStep(funcName, 6, { h: hId, key });
            const newLeftId = this.insertRecursive(h.left, key);
            // Re-fetch to get latest version (might have been modified during recursion)
            h = this.heap.get(hId);
            h.left = newLeftId;
            this.heap.set(hId, h);
        } else if (key > h.value) {
            // Line 7: else if (key > h.key)
            this.captureStep(funcName, 7, { h: hId, key });
            // Line 8: h.right = insert(h.right, key, val);
            this.captureStep(funcName, 8, { h: hId, key });
            const newRightId = this.insertRecursive(h.right, key);
            // Re-fetch to get latest version (might have been modified during recursion)
            h = this.heap.get(hId);
            h.right = newRightId;
            this.heap.set(hId, h);
        } else {
            // Line 9: else
            this.captureStep(funcName, 9, { h: hId, key });
            // Line 10: h.val = val;
            this.captureStep(funcName, 10, { h: hId, key });
            // Value already exists, no update needed
        }

        let currentHId = hId;

        // Line 12: if (isRed(h.right) && !isRed(h.left))
        this.captureStep(funcName, 12, { h: currentHId });
        h = this.heap.get(currentHId);
        if (this.isRed(h.right) && !this.isRed(h.left)) {
            // Line 13: h = rotateLeft(h);
            this.captureStep(funcName, 13, { h: currentHId });
            currentHId = this.rotateLeft(currentHId);
            this.context.setLocalVar('h', currentHId);
            this.captureStep(funcName, 13, { h: currentHId, note: 'after rotateLeft' });
        }

        // Line 14: if (isRed(h.left) && isRed(h.left.left))
        this.captureStep(funcName, 14, { h: currentHId });
        h = this.heap.get(currentHId);
        if (h.left && this.isRed(h.left)) {
            const leftNode = this.heap.get(h.left);
            if (leftNode.left && this.isRed(leftNode.left)) {
                // Line 15: h = rotateRight(h);
                this.captureStep(funcName, 15, { h: currentHId });
                currentHId = this.rotateRight(currentHId);
                this.context.setLocalVar('h', currentHId);
                this.captureStep(funcName, 15, { h: currentHId, note: 'after rotateRight' });
            }
        }

        // Line 16: if (isRed(h.left) && isRed(h.right))
        this.captureStep(funcName, 16, { h: currentHId });
        h = this.heap.get(currentHId);
        if (this.isRed(h.left) && this.isRed(h.right)) {
            // Line 17: colorFlip(h);
            this.captureStep(funcName, 17, { h: currentHId });
            this.colorFlip(currentHId);
            this.captureStep(funcName, 17, { h: currentHId, note: 'after colorFlip' });
        }

        // Line 19: return h;
        this.captureStep(funcName, 19, { h: currentHId, result: currentHId });
        this.context.popFrame();
        return currentHId;
    }

    // Delete minimum
    deleteMin() {
        this.tracer.reset();

        if (this.context.globalRootId === null) {
            this.captureStep('deleteMinPublic', 2, { error: 'empty tree' });
            return this.tracer.steps;
        }

        // Line 2: if (!isRed(root.left) && !isRed(root.right))
        this.captureStep('deleteMinPublic', 2, {});
        const root = this.heap.get(this.context.globalRootId);
        if (!this.isRed(root.left) && !this.isRed(root.right)) {
            // Line 3: root.color = RED;
            this.captureStep('deleteMinPublic', 3, {});
            root.color = 'red';
            this.heap.set(this.context.globalRootId, root);
        }

        // Line 5: root = deleteMin(root);
        this.captureStep('deleteMinPublic', 5, {});
        this.context.globalRootId = this.deleteMinRecursive(this.context.globalRootId);

        // Line 7: if (root != null)
        this.captureStep('deleteMinPublic', 7, {});
        if (this.context.globalRootId !== null) {
            // Line 8: root.color = BLACK;
            this.captureStep('deleteMinPublic', 8, {});
            const newRoot = this.heap.get(this.context.globalRootId);
            newRoot.color = 'black';
            this.heap.set(this.context.globalRootId, newRoot);
        }

        this.captureStep('deleteMinPublic', 8, { result: 'complete' });
        return this.tracer.steps;
    }

    deleteMinRecursive(hId) {
        const funcName = 'deleteMin';
        this.context.pushFrame(funcName, { h: hId });
        this.context.setLocalVar('h', hId);

        const h = this.heap.get(hId);

        // Line 2: if (h.left == null)
        this.captureStep(funcName, 2, { h: hId, leftNull: h.left === null });
        if (h.left === null) {
            // Line 3: return null;
            this.captureStep(funcName, 3, { h: hId, result: 'null' });
            this.context.popFrame();
            return null;
        }

        let currentHId = hId;

        // Line 5: if (!isRed(h.left) && !isRed(h.left.left))
        this.captureStep(funcName, 5, { h: currentHId });
        const currentH = this.heap.get(currentHId);
        if (currentH.left && !this.isRed(currentH.left)) {
            const leftNode = this.heap.get(currentH.left);
            if (!this.isRed(leftNode.left)) {
                // Line 6: h = moveRedLeft(h);
                this.captureStep(funcName, 6, { h: currentHId });
                currentHId = this.moveRedLeft(currentHId);
                this.context.setLocalVar('h', currentHId);
            }
        }

        // Line 8: h.left = deleteMin(h.left);
        this.captureStep(funcName, 8, { h: currentHId });
        let updatedH = this.heap.get(currentHId);
        const newLeftId = this.deleteMinRecursive(updatedH.left);
        // Re-fetch to avoid stale data
        updatedH = this.heap.get(currentHId);
        updatedH.left = newLeftId;
        this.heap.set(currentHId, updatedH);

        // Line 10: return fixUp(h);
        this.captureStep(funcName, 10, { h: currentHId });
        const result = this.fixUp(currentHId);

        this.context.popFrame();
        return result;
    }

    // Delete operation
    delete(key) {
        this.tracer.reset();

        if (this.context.globalRootId === null) {
            this.captureStep('deletePublic', 2, { error: 'empty tree' });
            return this.tracer.steps;
        }

        if (!this.contains(key)) {
            this.captureStep('deletePublic', 2, { error: 'key not found', key });
            return this.tracer.steps;
        }

        // Line 2: if (!isRed(root.left) && !isRed(root.right))
        this.captureStep('deletePublic', 2, { key });
        const root = this.heap.get(this.context.globalRootId);
        if (!this.isRed(root.left) && !this.isRed(root.right)) {
            // Line 3: root.color = RED;
            this.captureStep('deletePublic', 3, { key });
            root.color = 'red';
            this.heap.set(this.context.globalRootId, root);
        }

        // Line 5: root = delete(root, key);
        this.captureStep('deletePublic', 5, { key });
        this.context.globalRootId = this.deleteRecursive(this.context.globalRootId, key);

        // Line 7: if (root != null)
        this.captureStep('deletePublic', 7, { key });
        if (this.context.globalRootId !== null) {
            // Line 8: root.color = BLACK;
            this.captureStep('deletePublic', 8, { key });
            const newRoot = this.heap.get(this.context.globalRootId);
            newRoot.color = 'black';
            this.heap.set(this.context.globalRootId, newRoot);
        }

        this.captureStep('deletePublic', 8, { key, result: 'complete' });
        return this.tracer.steps;
    }

    deleteRecursive(hId, key) {
        const funcName = 'delete';
        this.context.pushFrame(funcName, { h: hId, key });
        this.context.setLocalVar('h', hId);

        let currentHId = hId;
        let h = this.heap.get(hId);

        // Line 2: if (key < h.key)
        this.captureStep(funcName, 2, { h: currentHId, key });

        if (key < h.value) {
            // Line 4-6
            this.captureStep(funcName, 4, { h: currentHId });
            if (h.left && !this.isRed(h.left)) {
                const leftNode = this.heap.get(h.left);
                if (!this.isRed(leftNode.left)) {
                    this.captureStep(funcName, 5, { h: currentHId });
                    currentHId = this.moveRedLeft(currentHId);
                    this.context.setLocalVar('h', currentHId);
                    this.captureStep(funcName, 5, { h: currentHId, note: 'after moveRedLeft' });
                }
            }
            this.captureStep(funcName, 6, { h: currentHId });
            h = this.heap.get(currentHId);
            const newLeftId = this.deleteRecursive(h.left, key);
            // Re-fetch to avoid stale data
            h = this.heap.get(currentHId);
            h.left = newLeftId;
            this.heap.set(currentHId, h);
        } else {
            // Line 10: if (isRed(h.left))
            this.captureStep(funcName, 10, { h: currentHId });
            if (this.isRed(h.left)) {
                // Line 11: h = rotateRight(h);
                this.captureStep(funcName, 11, { h: currentHId });
                currentHId = this.rotateRight(currentHId);
                this.context.setLocalVar('h', currentHId);
                this.captureStep(funcName, 11, { h: currentHId, note: 'after rotateRight' });
            }

            // Line 12: if (key == h.key && h.right == null)
            this.captureStep(funcName, 12, { h: currentHId, key });
            h = this.heap.get(currentHId);
            if (key === h.value && h.right === null) {
                this.captureStep(funcName, 13, { h: currentHId });
                this.context.popFrame();
                return null;
            }

            // Line 14: if (!isRed(h.right) && !isRed(h.right.left))
            this.captureStep(funcName, 14, { h: currentHId });
            h = this.heap.get(currentHId);
            if (h.right && !this.isRed(h.right)) {
                const rightNode = this.heap.get(h.right);
                if (!this.isRed(rightNode.left)) {
                    this.captureStep(funcName, 15, { h: currentHId });
                    currentHId = this.moveRedRight(currentHId);
                    this.context.setLocalVar('h', currentHId);
                    this.captureStep(funcName, 15, { h: currentHId, note: 'after moveRedRight' });
                }
            }

            // Line 16: if (key == h.key)
            this.captureStep(funcName, 16, { h: currentHId, key });
            h = this.heap.get(currentHId);
            if (key === h.value) {
                // Line 18-20
                const minNodeId = this.minNodeId(h.right);
                const minNode = this.heap.get(minNodeId);
                this.captureStep(funcName, 18, { h: currentHId, minKey: minNode.value });
                h.value = minNode.value;
                this.heap.set(currentHId, h);
                this.captureStep(funcName, 20, { h: currentHId });
                h = this.heap.get(currentHId);
                const newRightId1 = this.deleteMinRecursive(h.right);
                // Re-fetch to avoid stale data
                h = this.heap.get(currentHId);
                h.right = newRightId1;
                this.heap.set(currentHId, h);
            } else {
                // Line 23: h.right = delete(h.right, key);
                this.captureStep(funcName, 23, { h: currentHId });
                h = this.heap.get(currentHId);
                const newRightId2 = this.deleteRecursive(h.right, key);
                // Re-fetch to avoid stale data
                h = this.heap.get(currentHId);
                h.right = newRightId2;
                this.heap.set(currentHId, h);
            }
        }

        // Line 25: return fixUp(h);
        this.captureStep(funcName, 25, { h: currentHId });
        const result = this.fixUp(currentHId);

        this.context.popFrame();
        return result;
    }

    // Helper functions
    rotateLeft(hId) {
        this.context.pushFrame('rotateLeft', { h: hId });
        this.context.setLocalVar('h', hId);

        // Line 2: Node x = h.right;
        this.captureStep('rotateLeft', 2, { h: hId });
        const h = this.heap.get(hId);
        const xId = h.right;
        this.context.setLocalVar('x', xId);

        // Line 3: h.right = x.left;
        const x = this.heap.get(xId);
        this.captureStep('rotateLeft', 3, { h: hId, x: xId });
        h.right = x.left;
        this.heap.set(hId, h);
        this.captureStep('rotateLeft', 3, { h: hId, x: xId, note: 'after' });

        // Line 4: x.left = h;
        this.captureStep('rotateLeft', 4, { h: hId, x: xId });
        x.left = hId;
        this.heap.set(xId, x);
        this.captureStep('rotateLeft', 4, { h: hId, x: xId, note: 'after' });

        // Line 5: x.color = h.color;
        this.captureStep('rotateLeft', 5, { h: hId, x: xId });
        x.color = h.color;
        this.heap.set(xId, x);

        // Line 6: h.color = RED;
        this.captureStep('rotateLeft', 6, { h: hId, x: xId });
        h.color = 'red';
        this.heap.set(hId, h);

        // Line 7: return x;
        this.captureStep('rotateLeft', 7, { h: hId, x: xId, result: xId });
        this.context.popFrame();
        return xId;  // Return new subtree root ID
    }

    rotateRight(hId) {
        this.context.pushFrame('rotateRight', { h: hId });
        this.context.setLocalVar('h', hId);

        // Line 2: Node x = h.left;
        this.captureStep('rotateRight', 2, { h: hId });
        const h = this.heap.get(hId);
        const xId = h.left;
        this.context.setLocalVar('x', xId);

        // Line 3: h.left = x.right;
        const x = this.heap.get(xId);
        this.captureStep('rotateRight', 3, { h: hId, x: xId });
        h.left = x.right;
        this.heap.set(hId, h);
        this.captureStep('rotateRight', 3, { h: hId, x: xId, note: 'after' });

        // Line 4: x.right = h;
        this.captureStep('rotateRight', 4, { h: hId, x: xId });
        x.right = hId;
        this.heap.set(xId, x);
        this.captureStep('rotateRight', 4, { h: hId, x: xId, note: 'after' });

        // Line 5: x.color = h.color;
        this.captureStep('rotateRight', 5, { h: hId, x: xId });
        x.color = h.color;
        this.heap.set(xId, x);

        // Line 6: h.color = RED;
        this.captureStep('rotateRight', 6, { h: hId, x: xId });
        h.color = 'red';
        this.heap.set(hId, h);

        // Line 7: return x;
        this.captureStep('rotateRight', 7, { h: hId, x: xId, result: xId });
        this.context.popFrame();
        return xId;  // Return new subtree root ID
    }

    colorFlip(hId) {
        this.context.pushFrame('colorFlip', { h: hId });
        this.context.setLocalVar('h', hId);

        const h = this.heap.get(hId);

        // Line 2: h.color = !h.color;
        this.captureStep('colorFlip', 2, { h: hId });
        h.color = (h.color === 'red') ? 'black' : 'red';
        this.heap.set(hId, h);
        this.captureStep('colorFlip', 2, { h: hId, note: 'after' });

        // Line 3: h.left.color = !h.left.color;
        this.captureStep('colorFlip', 3, { h: hId });
        const leftId = h.left;
        const left = this.heap.get(leftId);
        left.color = (left.color === 'red') ? 'black' : 'red';
        this.heap.set(leftId, left);
        this.captureStep('colorFlip', 3, { h: hId, note: 'after' });

        // Line 4: h.right.color = !h.right.color;
        this.captureStep('colorFlip', 4, { h: hId });
        const rightId = h.right;
        const right = this.heap.get(rightId);
        right.color = (right.color === 'red') ? 'black' : 'red';
        this.heap.set(rightId, right);
        this.captureStep('colorFlip', 4, { h: hId, note: 'after' });

        this.context.popFrame();
    }

    moveRedLeft(hId) {
        this.context.pushFrame('moveRedLeft', { h: hId });
        this.context.setLocalVar('h', hId);

        // Line 2: colorFlip(h);
        this.captureStep('moveRedLeft', 2, { h: hId });
        this.colorFlip(hId);
        this.captureStep('moveRedLeft', 2, { h: hId, note: 'after colorFlip' });

        // Line 3: if (isRed(h.right.left))
        this.captureStep('moveRedLeft', 3, { h: hId });
        const h = this.heap.get(hId);
        if (h.right && this.isRed(this.heap.get(h.right).left)) {
            // Line 5: h.right = rotateRight(h.right);
            this.captureStep('moveRedLeft', 5, { h: hId });
            h.right = this.rotateRight(h.right);
            this.heap.set(hId, h);
            this.captureStep('moveRedLeft', 5, { h: hId, note: 'after rotateRight' });

            // Line 6: h = rotateLeft(h);
            this.captureStep('moveRedLeft', 6, { h: hId });
            const newHId = this.rotateLeft(hId);
            this.context.setLocalVar('h', newHId);
            this.captureStep('moveRedLeft', 6, { h: newHId, note: 'after rotateLeft' });

            // Line 7: colorFlip(h);
            this.captureStep('moveRedLeft', 7, { h: newHId });
            this.colorFlip(newHId);
            this.captureStep('moveRedLeft', 7, { h: newHId, note: 'after colorFlip' });

            // Line 9: return h;
            this.captureStep('moveRedLeft', 9, { h: newHId, result: newHId });
            this.context.popFrame();
            return newHId;
        }

        // Line 9: return h;
        this.captureStep('moveRedLeft', 9, { h: hId, result: hId });
        this.context.popFrame();
        return hId;
    }

    moveRedRight(hId) {
        this.context.pushFrame('moveRedRight', { h: hId });
        this.context.setLocalVar('h', hId);

        // Line 2: colorFlip(h);
        this.captureStep('moveRedRight', 2, { h: hId });
        this.colorFlip(hId);
        this.captureStep('moveRedRight', 2, { h: hId, note: 'after colorFlip' });

        // Line 3: if (isRed(h.left.left))
        this.captureStep('moveRedRight', 3, { h: hId });
        const h = this.heap.get(hId);
        if (h.left && this.isRed(this.heap.get(h.left).left)) {
            // Line 5: h = rotateRight(h);
            this.captureStep('moveRedRight', 5, { h: hId });
            const newHId = this.rotateRight(hId);
            this.context.setLocalVar('h', newHId);
            this.captureStep('moveRedRight', 5, { h: newHId, note: 'after rotateRight' });

            // Line 6: colorFlip(h);
            this.captureStep('moveRedRight', 6, { h: newHId });
            this.colorFlip(newHId);
            this.captureStep('moveRedRight', 6, { h: newHId, note: 'after colorFlip' });

            // Line 8: return h;
            this.captureStep('moveRedRight', 8, { h: newHId, result: newHId });
            this.context.popFrame();
            return newHId;
        }

        // Line 8: return h;
        this.captureStep('moveRedRight', 8, { h: hId, result: hId });
        this.context.popFrame();
        return hId;
    }

    fixUp(hId) {
        this.context.pushFrame('fixUp', { h: hId });
        this.context.setLocalVar('h', hId);

        let currentHId = hId;

        // Line 2: if (isRed(h.right))
        this.captureStep('fixUp', 2, { h: currentHId });
        let h = this.heap.get(currentHId);
        if (this.isRed(h.right)) {
            // Line 3: h = rotateLeft(h);
            this.captureStep('fixUp', 3, { h: currentHId });
            currentHId = this.rotateLeft(currentHId);
            this.context.setLocalVar('h', currentHId);
            this.captureStep('fixUp', 3, { h: currentHId, note: 'after rotateLeft' });
        }

        // Line 5: if (isRed(h.left) && isRed(h.left.left))
        this.captureStep('fixUp', 5, { h: currentHId });
        h = this.heap.get(currentHId);
        if (h.left && this.isRed(h.left)) {
            const leftNode = this.heap.get(h.left);
            if (leftNode.left && this.isRed(leftNode.left)) {
                // Line 6: h = rotateRight(h);
                this.captureStep('fixUp', 6, { h: currentHId });
                currentHId = this.rotateRight(currentHId);
                this.context.setLocalVar('h', currentHId);
                this.captureStep('fixUp', 6, { h: currentHId, note: 'after rotateRight' });
            }
        }

        // Line 8: if (isRed(h.left) && isRed(h.right))
        this.captureStep('fixUp', 8, { h: currentHId });
        h = this.heap.get(currentHId);
        if (this.isRed(h.left) && this.isRed(h.right)) {
            // Line 9: colorFlip(h);
            this.captureStep('fixUp', 9, { h: currentHId });
            this.colorFlip(currentHId);
            this.captureStep('fixUp', 9, { h: currentHId, note: 'after colorFlip' });
        }

        // Line 11: return h;
        this.captureStep('fixUp', 11, { h: currentHId, result: currentHId });
        this.context.popFrame();
        return currentHId;
    }

    // Helper: Find minimum node ID
    minNodeId(nodeId) {
        if (nodeId === null) return null;
        const node = this.heap.get(nodeId);
        if (node.left === null) return nodeId;
        return this.minNodeId(node.left);
    }

    // Helper: Check if value exists
    contains(value) {
        return this.searchId(this.context.globalRootId, value) !== null;
    }

    searchId(nodeId, value) {
        if (nodeId === null) return null;
        const node = this.heap.get(nodeId);
        if (value < node.value) return this.searchId(node.left, value);
        if (value > node.value) return this.searchId(node.right, value);
        return nodeId;
    }

    // Get tree statistics
    getStats() {
        return {
            nodeCount: this.countNodesById(this.context.globalRootId),
            height: this.heightById(this.context.globalRootId)
        };
    }

    countNodesById(nodeId) {
        if (nodeId === null) return 0;
        const node = this.heap.get(nodeId);
        return 1 + this.countNodesById(node.left) + this.countNodesById(node.right);
    }

    heightById(nodeId) {
        if (nodeId === null) return 0;
        const node = this.heap.get(nodeId);
        return 1 + Math.max(this.heightById(node.left), this.heightById(node.right));
    }

    // Clear the tree
    clear() {
        this.heap = new Heap();
        this.context = new ExecutionContext();
        this.tracer.reset();
    }
}
