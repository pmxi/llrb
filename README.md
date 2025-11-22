# LLRB 2-3 Tree Visualizer

An interactive web-based visualizer for Left-Leaning Red-Black (LLRB) 2-3 trees. This educational tool helps you understand how LLRB trees work by showing step-by-step execution of operations with visual feedback.

**[Live Demo →](https://YOUR_USERNAME.github.io/llrb)** *(Update this link after deployment)*

## Features

- **Interactive Tree Visualization**: See your LLRB tree rendered in real-time with red and black edges
- **Step-by-Step Algorithm Display**: Watch each operation execute line by line
- **Animation Controls**: Play, pause, and step through operations at your own pace
- **Three Core Operations**:
  - Insert: Add values to the tree
  - Delete: Remove specific values
  - Delete Min: Remove the minimum value

## Quick Start

1. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, or Edge)
2. That's it! No build step or server required.

## How to Use

### Basic Operations

1. **Insert a Value**:
   - Enter a number in the input field
   - Click "Insert" or press Enter
   - Watch the step-by-step execution

2. **Delete a Value**:
   - Enter the number you want to delete
   - Click "Delete"
   - The algorithm will show you how it finds and removes the value

3. **Delete Minimum**:
   - Click "Delete Min"
   - The smallest value will be removed from the tree

4. **Clear Tree**:
   - Click "Clear Tree" to start over

### Stepping Through Execution

- **⏮ Start**: Jump to the first step
- **← Back**: Go to the previous step (also: Left Arrow key)
- **▶ Play**: Automatically step through the algorithm (also: Spacebar)
- **→ Forward**: Go to the next step (also: Right Arrow key)
- **⏭ End**: Jump to the last step
- **Slider**: Scrub through any step in the execution

### Keyboard Shortcuts

- **Left Arrow**: Previous step
- **Right Arrow**: Next step
- **Spacebar**: Play/Pause automatic stepping
- **Enter** (in input field): Insert the value

### Understanding the Visualization

- **Black Edges**: Standard edges in the tree
- **Red Edges**: Represent the red links in the LLRB tree (these are left-leaning)
- **Node Values**: Displayed inside circles
- **Green Arrows**: Show which nodes variables (like `h`, `x`) are currently pointing to
- **Highlighted Code**: The current line being executed is highlighted with black background
- **Call Stack**: Shows the recursion depth and current function calls
- **Variable Values**: Displays current values of algorithm variables

## What is an LLRB 2-3 Tree?

A Left-Leaning Red-Black (LLRB) tree is a self-balancing binary search tree that maintains perfect balance by using red links to represent 3-nodes in a 2-3 tree. Key properties:

1. Red links lean left
2. No node has two red links
3. Perfect black balance (all paths from root to null have the same number of black links)
4. Simpler implementation than standard red-black trees

## Technical Details

- **Pure Client-Side**: No backend required, runs entirely in the browser
- **Technologies Used**:
  - Vanilla JavaScript (ES6+)
  - D3.js v7 for tree visualization
  - CSS Grid and Flexbox for layout
- **Browser Compatibility**: Works in all modern browsers

## File Structure

```
llrb/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styling
├── js/
│   ├── algorithms.js   # Sedgewick's LLRB algorithm definitions
│   ├── llrb.js         # LLRB tree implementation with execution tracing
│   ├── visualizer.js   # D3.js tree visualization
│   ├── pseudocode.js   # Step-by-step algorithm display
│   └── app.js          # Main application controller
└── README.md           # This file
```

## Educational Use

This visualizer is designed for learning purposes. Use it to:

- Understand how LLRB trees maintain balance
- See the relationship between 2-3 trees and LLRB trees
- Learn about tree rotations and color flips
- Practice insertion and deletion algorithms
- Study recursive algorithms with step-by-step visualization

## Credits

This visualizer implements the Left-Leaning Red-Black tree algorithms by **Robert Sedgewick**, as described in:

- *Algorithms, 4th Edition* by Robert Sedgewick and Kevin Wayne
- [Left-Leaning Red-Black Trees](https://sedgewick.io/wp-content/themes/sedgewick/papers/2008LLRB.pdf) (2008 paper)

The visual design is inspired by the tree diagrams in Sedgewick's *Algorithms* textbook.

## License

This project is open source and available for educational use.
