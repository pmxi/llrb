# Issue: Stale Tree Visualization During Rotations

## Project Context

This is an educational visualizer for **Left-Leaning Red-Black (LLRB) Trees**, implementing Sedgewick's algorithms. The visualizer allows students to step through tree operations line-by-line, seeing how the algorithm executes and how the tree structure transforms.

### How the Visualization System Works

**Architecture:**
1. **llrb.js** - Implements the actual tree data structure and operations
2. **ExecutionTracer** - Captures "snapshots" at each line of algorithm execution
3. **visualizer.js** - Renders the tree using D3.js
4. **pseudocode.js** - Displays algorithm code with line highlighting
5. **app.js** - Orchestrates stepping through the captured execution

**Execution Flow:**
```
User clicks insert(6)
  ↓
llrb.js executes the operation
  ↓
At each algorithm line, calls: tracer.addStep(funcName, lineNum, vars, this.serializeTree())
  ↓
Returns array of steps: [{funcName, lineNumber, variables, treeState}, ...]
  ↓
User presses → to step forward
  ↓
visualizer.js renders step.treeState
```

**Key Method: `serializeTree()`**
```javascript
serializeTree() {
    return this.serializeNode(this.root);  // Always starts from this.root
}

serializeNode(node) {
    if (node === null) return null;
    return {
        value: node.value,
        color: node.color ? 'red' : 'black',
        left: this.serializeNode(node.left),   // Recursive
        right: this.serializeNode(node.right)
    };
}
```

This creates a plain JavaScript object snapshot of the entire tree structure that can be stored, cloned, and later visualized.

## Problem Summary

Nodes appear to "disappear" or the tree shows stale/incorrect states during step-by-step execution, particularly after rotation operations. This is caused by a fundamental mismatch between when local variables update during recursion and when `this.root` reflects those changes.

## Root Cause

The visualization system calls `this.serializeTree()` to capture tree snapshots, which **always serializes from `this.root`**. However, during recursive operations, updates happen to **local variables** first, and `this.root` only reflects these changes after the entire recursion unwinds.

### Why This Happens

When rotations occur during recursion:

1. **Rotation reassigns local variable `h`** to point to a different node object:
   ```javascript
   h = rotateLeft(h);  // h now points to what was h.right
   ```

2. **The parent's pointer is NOT updated yet**:
   ```javascript
   // Parent still has: node@2.right → node@5
   // But local h now points to: node@6
   ```

3. **The rotation modifies the node objects**:
   ```javascript
   // Inside rotateLeft(node@5):
   node@5.right = null           // Broke the link to node@6
   node@6.left = node@5          // node@6 is now the subtree root
   return node@6
   ```

4. **Result: node@6 is unreachable from `this.root`**:
   ```
   this.root → node@2 → right → node@5 → right → null

   (orphaned) node@6 → left → node@5
   ```

5. **The assignment happens when recursion returns**:
   ```javascript
   // Parent finally executes:
   h.right = insertRecursive(h.right, 6);  // Now node@2.right → node@6
   ```

### Example Scenario

**Tree state before inserting 6:**
```
    2 (black)
   / \
  1   5 (black)
```

**After inserting 6, we have:**
```
    2 (black)
   / \
  1   5 (black)
       \
        6 (red)  ← Right-leaning red link!
```

**During rotation at node 5:**

1. **Code executes:** `h = this.rotateLeft(h);`
   - Local variable `h` now points to node@6 with structure:
     ```
     6 (black)
    /
   5 (red)
     ```

2. **Snapshot captured:** `this.serializeTree()`
   - Serializes from `this.root` (node@2)
   - Follows: `node@2 → right → node@5`
   - But `node@5.right = null` now (was modified by rotation!)
   - **Problem:** Parent's pointer (`node@2.right`) still points to node@5, not node@6!
   - Shows **stale** structure:
     ```
     2
    / \
   1   5  ← Dead end! (right = null)
     ```
   - **Node 6 is unreachable from this.root - it "disappeared"!**

3. **Recursion returns:** `return h` (node@6) to parent
   - Parent executes: `h.right = insertRecursive(h.right, 6)`
   - NOW `node@2.right` points to node@6
   - Tree is finally correct:
     ```
     2
    / \
   1   6
      /
     5
     ```

## Memory State During Rotation

```
After h = rotateLeft(h) at node@5:

Objects in Memory:
┌─────────────────────────────────────┐
│ node@2 { right: node@5 } ← this.root│
│ node@5 { left: null, right: null }  │
│ node@6 { left: node@5, right: null }│ ← ORPHANED!
└─────────────────────────────────────┘

Pointer Chain from this.root:
this.root → node@2 → right → node@5 → right → null ✗

Local variable h:
h → node@6 → left → node@5 ✓ (but not reachable from this.root!)
```

The rotation created a new subtree structure, but the parent's pointer hasn't been updated yet, so the new structure is unreachable from `this.root`.

## Visual Timeline

```
Time 1: BEFORE h = rotateLeft(h)
├─ Local variable h → node@5 → { value: 5, right: node@6 }
├─ Parent pointer (node@2.right) → node@5
└─ serializeTree() from this.root: 2 → right → 5 → right → 6  ✓ Correct

Time 2: AFTER h = rotateLeft(h)
├─ Local variable h → node@6 → { value: 6, left: node@5 }  ← UPDATED!
├─ Parent pointer (node@2.right) → node@5  ← NOT updated yet!
├─ node@5 modified: { value: 5, left: null, right: null }
└─ serializeTree() from this.root: 2 → right → 5 → null  ✗ STALE!
    (Node 6 is orphaned - unreachable from this.root!)

Time 3: AFTER return h to parent (recursion unwinds)
├─ Parent executes: node@2.right = h (which is node@6)
└─ serializeTree() from this.root: 2 → right → 6 → left → 5  ✓ Correct
```

## Scope of the Issue

**This issue occurs for ANY rotation at ANY depth:**
- Not just when the root rotates
- Happens in deeply nested subtrees
- Occurs because parent pointers lag behind local variable updates

**This issue does NOT occur for:**
- Simple leaf insertions (modifying `.left` or `.right` properties of existing nodes)
- Color flips (modifying `.color` properties)
- Any operation that only modifies node properties without reassigning `h`

**Where rotations occur:**
1. **`insert()`** - Lines 210-213, 218-222 in llrb.js
2. **`fixUp()`** - Lines 552-556, 561-565
3. **`delete()`** - Lines 364-368
4. **`moveRedLeft()`** - Lines 508-516
5. **`moveRedRight()`** - Lines 541-544

## Current "Fix" (Incomplete)

We've added extra steps after rotation assignments to capture the updated state:

```javascript
h = this.rotateLeft(h);
this.tracer.addStep(funcName, 13, { h: h.value, rotated: true }, this.serializeTree());
```

**Problem:** This STILL serializes from `this.root`, which hasn't been updated yet! The orphaned subtree remains unreachable.

## Additional Issue: Floating Nodes Feature

The `floatingNodes` feature was an attempt to show temporarily detached subtrees during rotations. However:

1. It tries to track nodes that are "detached" during rotation
2. But `serializeTree()` from `this.root` can't see these orphaned subtrees
3. Creates visual confusion and clutter
4. Adds significant complexity (~400 lines of code) with no educational value

**The feature is fundamentally incompatible with the serialization-from-root approach.**

## Files Affected

- `/src/js/llrb.js` - All rotation/colorFlip step captures
- `/src/js/visualizer.js` - `renderFloatingNodes()` method (lines 368-440)
- `/src/js/app.js` - Line 263 passes `floatingNodes` parameter
- `/src/js/ExecutionTracer` (in llrb.js) - `addStep()` accepts `floatingNodes` parameter
