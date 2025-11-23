/**
 * Static Algorithm Definitions (Sedgewick's LLRB algorithms)
 *
 * These are the "textbook" versions of the algorithms - they're never executed!
 * They serve as the reference pseudocode that gets displayed in the UI.
 *
 * HOW THE STEPPING SYSTEM WORKS:
 * 1. These algorithms are stored as strings with their original line numbers
 * 2. The real implementation (llrb.js) calls tracer.addStep(funcName, lineNumber, ...)
 * 3. The lineNumber must match the line in ALGORITHMS[funcName]
 * 4. The UI highlights the matching line in pseudocode display
 *
 * Example:
 *   - ALGORITHMS['insert'] contains "if (h == null) return new Node..." at line 2
 *   - llrb.js calls tracer.addStep('insert', 2, ...) before that check
 *   - UI highlights line 2 of the insert algorithm when displaying that step
 *
 * IMPORTANT: Line numbers in llrb.js must stay synchronized with these algorithms!
 */

const ALGORITHMS = {
    insert: `private Node insert(Node h, Key key, Value val)
{
    if (h == null) return new Node(key, val, RED);

    if (key < h.key) h.left = insert(h.left, key, val);
    else if (key > h.key) h.right = insert(h.right, key, val);
    else h.val = val;

    if (isRed(h.right) && !isRed(h.left)) h = rotateLeft(h);
    if (isRed(h.left) && isRed(h.left.left)) h = rotateRight(h);
    if (isRed(h.left) && isRed(h.right)) colorFlip(h);

    return h;
}`,

    deleteMin: `private Node deleteMin(Node h)
{
    if (h.left == null) return null;

    if (!isRed(h.left) && !isRed(h.left.left))
        h = moveRedLeft(h);

    h.left = deleteMin(h.left);

    return fixUp(h);
}`,

    delete: `private Node delete(Node h, Key key)
{
    if (key < h.key)
    {
        if (!isRed(h.left) && !isRed(h.left.left))
            h = moveRedLeft(h);
        h.left = delete(h.left, key);
    }
    else
    {
        if (isRed(h.left))
            h = rotateRight(h);
        if (key == h.key && h.right == null)
            return null;
        if (!isRed(h.right) && !isRed(h.right.left))
            h = moveRedRight(h);
        if (key == h.key)
        {
            h.val = get(h.right, min(h.right).key);
            h.key = min(h.right).key;
            h.right = deleteMin(h.right);
        }
        else h.right = delete(h.right, key);
    }
    return fixUp(h);
}`,

    moveRedLeft: `private Node moveRedLeft(Node h)
{
    colorFlip(h);
    if (isRed(h.right.left))
    {
        h.right = rotateRight(h.right);
        h = rotateLeft(h);
        colorFlip(h);
    }
    return h;
}`,

    moveRedRight: `private Node moveRedRight(Node h)
{
    colorFlip(h);
    if (isRed(h.left.left))
    {
        h = rotateRight(h);
        colorFlip(h);
    }
    return h;
}`,

    fixUp: `private Node fixUp(Node h)
{
    if (isRed(h.right)) h = rotateLeft(h);

    if (isRed(h.left) && isRed(h.left.left))
        h = rotateRight(h);

    if (isRed(h.left) && isRed(h.right))
        colorFlip(h);

    return h;
}`,

    rotateLeft: `private Node rotateLeft(Node h)
{
    Node x = h.right;
    h.right = x.left;
    x.left = h;
    x.color = h.color;
    h.color = RED;
    return x;
}`,

    rotateRight: `private Node rotateRight(Node h)
{
    Node x = h.left;
    h.left = x.right;
    x.right = h;
    x.color = h.color;
    h.color = RED;
    return x;
}`,

    colorFlip: `private void colorFlip(Node h)
{
    h.color = !h.color;
    h.left.color = !h.left.color;
    h.right.color = !h.right.color;
}`
};

/**
 * Parse algorithm text into structured lines for display.
 *
 * Converts a multi-line algorithm string into an array of line objects
 * that the UI can use for rendering with syntax highlighting and line numbers.
 *
 * @param {string} algorithmText - Raw algorithm text (multi-line string)
 * @returns {Array<{lineNumber: number, text: string, indent: number}>}
 *
 * @example
 * parseAlgorithm("if (h == null)\n  return x;")
 * // Returns:
 * // [{lineNumber: 0, text: "if (h == null)", indent: 0},
 * //  {lineNumber: 1, text: "  return x;", indent: 2}]
 */
function parseAlgorithm(algorithmText) {
    return algorithmText.split('\n').map((line, index) => ({
        lineNumber: index,
        text: line,
        indent: line.search(/\S|$/)  // Count leading whitespace
    }));
}

/**
 * Pre-parsed algorithms for fast lookup during rendering.
 *
 * The UI (pseudocode.js) looks up PARSED_ALGORITHMS[funcName] to get
 * the line-by-line breakdown of an algorithm, then highlights the current line.
 *
 * @type {Object<string, Array>}
 * @example
 * PARSED_ALGORITHMS['insert'][2]
 * // Returns: {lineNumber: 2, text: "if (h == null)...", indent: 4}
 */
const PARSED_ALGORITHMS = {};
for (const [name, code] of Object.entries(ALGORITHMS)) {
    PARSED_ALGORITHMS[name] = parseAlgorithm(code);
}
