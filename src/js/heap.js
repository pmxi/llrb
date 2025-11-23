/**
 * Heap - Explicit Memory Model for LLRB Tree
 *
 * Instead of using JavaScript object references (node.left = node),
 * we use explicit IDs (node.left = "n2"). This allows us to:
 * 1. Serialize the complete memory state at any moment
 * 2. Track which nodes are reachable from the global root vs stack frames
 * 3. Eliminate the "orphaned node" problem during rotations
 */
class Heap {
    constructor() {
        /** @type {Map<string, {value: number, color: string, left: string|null, right: string|null}>} */
        this.nodes = new Map();
        /** @type {number} ID counter */
        this.nextId = 1;
    }

    /**
     * Allocate a new node in the heap
     * @param {number} value - Node value
     * @param {string} color - 'red' or 'black'
     * @returns {string} Node ID
     */
    allocate(value, color = 'red') {
        const id = `n${this.nextId++}`;
        this.nodes.set(id, {
            value,
            color,
            left: null,
            right: null
        });
        return id;
    }

    /**
     * Get node data by ID
     * @param {string|null} id - Node ID
     * @returns {{value: number, color: string, left: string|null, right: string|null}|null}
     */
    get(id) {
        return id ? this.nodes.get(id) : null;
    }

    /**
     * Update node data
     * @param {string} id - Node ID
     * @param {{value: number, color: string, left: string|null, right: string|null}} data - Node data
     */
    set(id, data) {
        this.nodes.set(id, data);
    }

    /**
     * Delete node from heap
     * @param {string} id - Node ID
     */
    delete(id) {
        this.nodes.delete(id);
    }

    /**
     * Create a deep copy snapshot of the entire heap
     * @returns {Object<string, {value: number, color: string, left: string|null, right: string|null}>}
     */
    snapshot() {
        return structuredClone(Object.fromEntries(this.nodes));
    }
}

/**
 * ExecutionContext - Tracks Global Root and Call Stack
 *
 * During recursion, local variables (like 'h') can point to nodes that
 * are temporarily unreachable from the global root. By tracking the call
 * stack explicitly, we can visualize these "detached" subtrees.
 */
class ExecutionContext {
    constructor() {
        /** @type {string|null} Global root node ID */
        this.globalRootId = null;
        /** @type {Array<{funcName: string, params: Object, vars: Object<string, string>}>} */
        this.stack = [];
    }

    /**
     * Push a new stack frame (entering a function)
     * @param {string} funcName - Function name
     * @param {Object} params - Function parameters
     */
    pushFrame(funcName, params) {
        this.stack.push({
            funcName,
            params,
            vars: {} // Local variables like {h: "n5", x: "n3"}
        });
    }

    /**
     * Pop the top stack frame (exiting a function)
     */
    popFrame() {
        this.stack.pop();
    }

    /**
     * Set a local variable in the current stack frame
     * @param {string} name - Variable name (e.g., 'h', 'x')
     * @param {string|null} nodeId - Node ID or null
     */
    setLocalVar(name, nodeId) {
        if (this.stack.length > 0) {
            this.stack[this.stack.length - 1].vars[name] = nodeId;
        }
    }

    /**
     * Get a local variable from the current stack frame
     * @param {string} name - Variable name
     * @returns {string|null} Node ID or null
     */
    getLocalVar(name) {
        if (this.stack.length > 0) {
            return this.stack[this.stack.length - 1].vars[name];
        }
        return null;
    }

    /**
     * Create a deep copy snapshot of the execution context
     * @returns {{globalRootId: string|null, stack: Array}}
     */
    snapshot() {
        return {
            globalRootId: this.globalRootId,
            stack: structuredClone(this.stack)
        };
    }
}
