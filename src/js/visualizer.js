// D3.js Tree Visualizer for LLRB Tree

class TreeVisualizer {
    constructor(svgId) {
        this.svg = d3.select(`#${svgId}`);
        this.width = 700;
        this.height = 450;
        this.nodeRadius = 24;
        this.levelHeight = 55; // Vertical spacing between levels - MUCH tighter
        this.nodeSpacing = 30;  // Base horizontal spacing between nodes - MUCH tighter

        this.svg.attr('width', this.width)
                .attr('height', this.height)
                .style('cursor', 'grab');

        this.g = this.svg.append('g')
                         .attr('transform', 'translate(0, 50)');

        // Default transform values
        this.defaultTranslateX = 0;
        this.defaultTranslateY = 50;

        // Enable pan/drag
        this.setupPanZoom();
    }

    setupPanZoom() {
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.currentTranslateX = this.defaultTranslateX;
        this.currentTranslateY = this.defaultTranslateY;

        this.svg.on('mousedown', (event) => {
            this.isDragging = true;
            this.startX = event.clientX;
            this.startY = event.clientY;
            this.svg.style('cursor', 'grabbing');
        });

        this.svg.on('mousemove', (event) => {
            if (!this.isDragging) return;

            const dx = event.clientX - this.startX;
            const dy = event.clientY - this.startY;

            this.currentTranslateX += dx;
            this.currentTranslateY += dy;

            this.g.attr('transform', `translate(${this.currentTranslateX}, ${this.currentTranslateY})`);

            this.startX = event.clientX;
            this.startY = event.clientY;

            this.updateResetButtonVisibility();
        });

        this.svg.on('mouseup', () => {
            this.isDragging = false;
            this.svg.style('cursor', 'grab');
        });

        this.svg.on('mouseleave', () => {
            this.isDragging = false;
            this.svg.style('cursor', 'grab');
        });
    }

    resetView() {
        this.currentTranslateX = this.defaultTranslateX;
        this.currentTranslateY = this.defaultTranslateY;
        this.g.transition()
              .duration(300)
              .attr('transform', `translate(${this.currentTranslateX}, ${this.currentTranslateY})`);
        this.updateResetButtonVisibility();
    }

    isViewMoved() {
        return this.currentTranslateX !== this.defaultTranslateX ||
               this.currentTranslateY !== this.defaultTranslateY;
    }

    updateResetButtonVisibility() {
        const resetBtn = document.getElementById('reset-view-btn');
        if (resetBtn) {
            resetBtn.style.display = this.isViewMoved() ? 'inline-block' : 'none';
        }
    }

    // Create straight line path between two points
    straightLink(source, target) {
        return `M${source.x},${source.y} L${target.x},${target.y}`;
    }

    // Build tree structure from heap
    buildTreeFromHeap(heap, nodeId, stopAtNodes = null) {
        if (nodeId === null) return null;
        const node = heap[nodeId];
        if (!node) return null;

        // Stop if we hit a node we should avoid (e.g., already reachable from root)
        if (stopAtNodes && stopAtNodes.has(nodeId)) return null;

        return {
            value: node.value,
            color: node.color,
            left: this.buildTreeFromHeap(heap, node.left, stopAtNodes),
            right: this.buildTreeFromHeap(heap, node.right, stopAtNodes)
        };
    }

    // Mark all nodes reachable from a given root
    markReachable(heap, nodeId, reachableSet) {
        if (nodeId === null || !heap[nodeId]) return;
        if (reachableSet.has(nodeId)) return; // Already visited

        reachableSet.add(nodeId);
        const node = heap[nodeId];
        this.markReachable(heap, node.left, reachableSet);
        this.markReachable(heap, node.right, reachableSet);
    }

    // Find all nodes in heap that aren't reachable from global root
    findOrphanedNodes(heap, context) {
        if (!heap || !context) return [];

        // Find all nodes reachable from global root
        const reachable = new Set();
        this.markReachable(heap, context.globalRootId, reachable);

        // Find all nodes in heap that aren't reachable
        // When building orphaned subtrees, stop at nodes that ARE reachable
        // (prevents showing the same node in both main tree and orphaned box)
        const orphaned = [];
        for (const [nodeId, node] of Object.entries(heap)) {
            if (!reachable.has(nodeId)) {
                orphaned.push({
                    id: nodeId,
                    tree: this.buildTreeFromHeap(heap, nodeId, reachable)
                });
            }
        }

        return orphaned;
    }

    // Custom layout that respects left/right positioning
    layoutTree(data, x = this.width / 2, y = 0, level = 0) {
        if (!data) return null;

        // Calculate horizontal spacing based on tree depth
        // Compact spacing like Sedgewick's diagrams
        const horizontalSpacing = this.nodeSpacing * Math.pow(1.6, Math.max(0, 3 - level));

        const node = {
            data: data,
            x: x,
            y: y,
            children: []
        };

        // Layout left child - always to the LEFT
        if (data.left) {
            const leftChild = this.layoutTree(data.left, x - horizontalSpacing, y + this.levelHeight, level + 1);
            node.children.push({ parent: node, child: leftChild, side: 'left' });
        }

        // Layout right child - always to the RIGHT
        if (data.right) {
            const rightChild = this.layoutTree(data.right, x + horizontalSpacing, y + this.levelHeight, level + 1);
            node.children.push({ parent: node, child: rightChild, side: 'right' });
        }

        return node;
    }

    // Collect all nodes from custom layout
    collectNodes(node, nodes = []) {
        if (!node) return nodes;
        nodes.push(node);
        node.children.forEach(({ child }) => this.collectNodes(child, nodes));
        return nodes;
    }

    // Collect all links from custom layout
    collectLinks(node, links = []) {
        if (!node) return links;
        node.children.forEach(({ parent, child, side }) => {
            links.push({
                source: parent,
                target: child,
                side: side,
                color: child.data.color
            });
            this.collectLinks(child, links);
        });
        return links;
    }

    // Visualize the tree
    visualize(heap, context, variables = {}) {
        // Clear previous visualization
        this.g.selectAll('*').remove();

        // Build tree from heap
        const treeData = this.buildTreeFromHeap(heap, context?.globalRootId);

        if (!treeData) {
            // Empty tree - show message
            this.g.append('text')
                  .attr('x', this.width / 2 - 80)
                  .attr('y', this.height / 2 - 50)
                  .attr('fill', '#999')
                  .attr('font-style', 'italic')
                  .text('Tree is empty');
            this.updateResetButtonVisibility();
            return;
        }

        // Use custom layout
        const root = this.layoutTree(treeData);
        const nodes = this.collectNodes(root);
        const links = this.collectLinks(root);

        // Create separate groups for links and nodes to control z-order
        const linksGroup = this.g.append('g').attr('class', 'links-layer');
        const nodesGroup = this.g.append('g').attr('class', 'nodes-layer');
        const labelsGroup = this.g.append('g').attr('class', 'labels-layer');

        // Define arrowhead marker
        const defs = this.svg.select('defs').empty() ? this.svg.append('defs') : this.svg.select('defs');
        if (defs.select('#arrowhead').empty()) {
            defs.append('marker')
                .attr('id', 'arrowhead')
                .attr('markerWidth', 10)
                .attr('markerHeight', 10)
                .attr('refX', 9)
                .attr('refY', 3)
                .attr('orient', 'auto')
                .append('polygon')
                .attr('points', '0 0, 10 3, 0 6')
                .attr('fill', '#2d9f2d');
        }

        // Draw links (edges) - STRAIGHT LINES from center to center
        linksGroup.selectAll('.link')
              .data(links)
              .enter()
              .append('line')
              .attr('class', d => `link ${d.color}`)
              .attr('x1', d => d.source.x)
              .attr('y1', d => d.source.y)
              .attr('x2', d => d.target.x)
              .attr('y2', d => d.target.y);

        // Draw nodes on top
        const nodeGroups = nodesGroup.selectAll('.node')
                            .data(nodes)
                            .enter()
                            .append('g')
                            .attr('class', 'node')
                            .attr('transform', d => `translate(${d.x}, ${d.y})`);

        // Node circles
        nodeGroups.append('circle')
             .attr('r', this.nodeRadius);

        // Node labels
        nodeGroups.append('text')
             .text(d => d.data.value);

        // Add variable pointers
        this.addVariablePointers(labelsGroup, nodes, variables);

        // Render orphaned nodes (nodes in heap but not reachable from root)
        this.renderOrphanedNodes(heap, context);

        // Update reset button visibility
        this.updateResetButtonVisibility();
    }

    // Add visual indicators for variables pointing to nodes
    addVariablePointers(labelsGroup, nodes, variables) {
        const pointerOffset = 35; // Distance from node center

        Object.entries(variables).forEach(([varName, varValue]) => {
            // Skip non-numeric values
            if (typeof varValue !== 'number') return;

            // Find the node that matches this variable's value
            const targetNode = nodes.find(n => n.data.value === varValue);
            if (!targetNode) return;

            // Add pointer label
            const label = labelsGroup.append('g')
                .attr('class', 'var-pointer')
                .attr('transform', `translate(${targetNode.x + pointerOffset}, ${targetNode.y})`);

            // Arrow line pointing to node
            label.append('line')
                .attr('x1', -8)
                .attr('y1', 0)
                .attr('x2', -pointerOffset + this.nodeRadius + 2)
                .attr('y2', 0)
                .attr('stroke', '#2d9f2d')
                .attr('stroke-width', 2)
                .attr('marker-end', 'url(#arrowhead)');

            // Variable name
            label.append('text')
                .attr('x', 0)
                .attr('y', 0)
                .attr('class', 'var-pointer-text')
                .text(varName);
        });
    }

    // Update visualization with animation
    update(heap, context, duration = 300, variables = {}) {
        // Build tree from heap
        const treeData = this.buildTreeFromHeap(heap, context?.globalRootId);

        if (!treeData) {
            this.visualize(heap, context, variables);
            return;
        }

        // Use custom layout
        const root = this.layoutTree(treeData);
        const nodeData = this.collectNodes(root);
        const linkData = this.collectLinks(root);

        // Ensure we have layers
        let linksLayer = this.g.select('.links-layer');
        let nodesLayer = this.g.select('.nodes-layer');

        if (linksLayer.empty()) {
            linksLayer = this.g.append('g').attr('class', 'links-layer');
        }
        if (nodesLayer.empty()) {
            nodesLayer = this.g.append('g').attr('class', 'nodes-layer');
        }

        // Update links with transition - STRAIGHT LINES from center to center
        const links = linksLayer.selectAll('.link')
                            .data(linkData, d => `${d.source.data.value}-${d.target.data.value}`);

        // Remove old links
        links.exit()
             .transition()
             .duration(duration)
             .style('opacity', 0)
             .remove();

        // Add new links
        links.enter()
             .append('line')
             .attr('class', d => `link ${d.color}`)
             .style('opacity', 0)
             .attr('x1', d => d.source.x)
             .attr('y1', d => d.source.y)
             .attr('x2', d => d.target.x)
             .attr('y2', d => d.target.y)
             .transition()
             .duration(duration)
             .style('opacity', 1);

        // Update existing links
        links.transition()
             .duration(duration)
             .attr('class', d => `link ${d.color}`)
             .attr('x1', d => d.source.x)
             .attr('y1', d => d.source.y)
             .attr('x2', d => d.target.x)
             .attr('y2', d => d.target.y);

        // Update nodes
        const nodes = nodesLayer.selectAll('.node')
                            .data(nodeData, d => d.data.value);

        // Remove old nodes
        nodes.exit()
             .transition()
             .duration(duration)
             .style('opacity', 0)
             .remove();

        // Add new nodes
        const newNodes = nodes.enter()
                              .append('g')
                              .attr('class', 'node')
                              .style('opacity', 0)
                              .attr('transform', d => `translate(${d.x}, ${d.y})`);

        newNodes.append('circle')
                .attr('r', this.nodeRadius);

        newNodes.append('text')
                .text(d => d.data.value);

        newNodes.transition()
                .duration(duration)
                .style('opacity', 1);

        // Update existing nodes
        nodes.transition()
             .duration(duration)
             .attr('transform', d => `translate(${d.x}, ${d.y})`);

        // Update variable pointers
        let labelsLayer = this.g.select('.labels-layer');
        if (labelsLayer.empty()) {
            labelsLayer = this.g.append('g').attr('class', 'labels-layer');
        }

        // Clear old pointers and add new ones
        labelsLayer.selectAll('.var-pointer').remove();
        this.addVariablePointers(labelsLayer, nodeData, variables);

        // Render orphaned nodes
        this.renderOrphanedNodes(heap, context);

        // Update reset button visibility
        this.updateResetButtonVisibility();
    }

    // Render orphaned nodes (exist in heap but unreachable from global root)
    renderOrphanedNodes(heap, context) {
        const orphaned = this.findOrphanedNodes(heap, context);
        if (!orphaned.length) return;

        let orphanedLayer = this.g.select('.orphaned-layer');
        if (orphanedLayer.empty()) {
            orphanedLayer = this.g.append('g').attr('class', 'orphaned-layer');
        }

        // Clear previous
        orphanedLayer.selectAll('*').remove();

        // Background box to make orphaned nodes obvious
        const boxWidth = 200;
        const headerHeight = 35;
        const itemHeight = 100;
        const boxHeight = headerHeight + (itemHeight * orphaned.length) + 10;
        const boxX = 10;
        const boxY = this.height - boxHeight - 10;

        orphanedLayer.append('rect')
            .attr('class', 'orphaned-box')
            .attr('x', boxX)
            .attr('y', boxY)
            .attr('rx', 8)
            .attr('ry', 8)
            .attr('width', boxWidth)
            .attr('height', boxHeight)
            .attr('fill', '#fff3cd')
            .attr('stroke', '#ffc107')
            .attr('stroke-width', 2)
            .attr('opacity', 0.9);

        orphanedLayer.append('text')
            .attr('x', boxX + 10)
            .attr('y', boxY + 20)
            .attr('fill', '#856404')
            .attr('font-weight', 'bold')
            .attr('font-size', '12px')
            .text('⚠ Orphaned (unreachable from root)');

        orphaned.forEach((item, idx) => {
            const itemY = boxY + headerHeight + (idx * itemHeight);

            orphanedLayer.append('text')
                .attr('x', boxX + 10)
                .attr('y', itemY + 14)
                .attr('fill', '#856404')
                .attr('font-size', '11px')
                .text(`Node ${item.id}:`);

            const baseX = boxX + boxWidth / 2;
            const baseY = itemY + 40;

            const root = this.layoutTree(item.tree, baseX, baseY, 0);
            if (!root) return;

            const nodes = this.collectNodes(root);
            const links = this.collectLinks(root);

            const group = orphanedLayer.append('g').attr('class', 'orphaned-tree');

            group.selectAll('.orphaned-link')
                .data(links)
                .enter()
                .append('line')
                .attr('class', d => `link orphaned-link ${d.color}`)
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y)
                .attr('opacity', 0.7);

            const nodeGroups = group.selectAll('.orphaned-node')
                .data(nodes)
                .enter()
                .append('g')
                .attr('class', 'node orphaned-node')
                .attr('transform', d => `translate(${d.x}, ${d.y})`);

            nodeGroups.append('circle')
                .attr('r', this.nodeRadius * 0.7)
                .attr('opacity', 0.7);

            nodeGroups.append('text')
                .text(d => d.data.value)
                .attr('opacity', 0.7);
        });
    }
}
