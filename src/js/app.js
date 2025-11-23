// Main Application Controller

class LLRBApp {
    constructor() {
        // Initialize components
        this.tree = new LLRBTree();
        this.visualizer = new TreeVisualizer('tree-svg');
        this.pseudocode = new PseudocodeDisplay('pseudocode-display');
        this.isPlaying = false;
        this.playInterval = null;
        this.playDelay = 650; // ms between auto-steps

        // Get UI elements
        this.elements = {
            insertInput: document.getElementById('insert-input'),
            insertGoBtn: document.getElementById('insert-go-btn'),
            deleteInput: document.getElementById('delete-input'),
            deleteGoBtn: document.getElementById('delete-go-btn'),
            deleteMinGoBtn: document.getElementById('delete-min-go-btn'),
            clearBtn: document.getElementById('clear-btn'),
            resetViewBtn: document.getElementById('reset-view-btn'),
            stepStartBtn: document.getElementById('step-start-btn'),
            stepBackBtn: document.getElementById('step-back-btn'),
            playPauseBtn: document.getElementById('play-pause-btn'),
            stepForwardBtn: document.getElementById('step-forward-btn'),
            stepEndBtn: document.getElementById('step-end-btn'),
            stepSlider: document.getElementById('step-slider'),
            stepLabel: document.getElementById('step-label'),
            stepSummary: document.getElementById('step-summary'),
            nodeCount: document.getElementById('node-count'),
            treeHeight: document.getElementById('tree-height'),
            operationStatus: document.getElementById('operation-status')
        };

        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Operation buttons
        this.elements.insertGoBtn.addEventListener('click', () => this.handleInsert());
        this.elements.deleteGoBtn.addEventListener('click', () => this.handleDelete());
        this.elements.deleteMinGoBtn.addEventListener('click', () => this.handleDeleteMin());
        this.elements.clearBtn.addEventListener('click', () => this.handleClear());
        this.elements.resetViewBtn.addEventListener('click', () => this.visualizer.resetView());

        // Step controls
        this.elements.stepStartBtn.addEventListener('click', () => this.jumpToStep(0));
        this.elements.stepBackBtn.addEventListener('click', () => this.handleStepBack());
        this.elements.playPauseBtn.addEventListener('click', () => this.handlePlayPause());
        this.elements.stepForwardBtn.addEventListener('click', () => this.handleStepForward());
        this.elements.stepEndBtn.addEventListener('click', () => this.jumpToStep(this.pseudocode.steps.length - 1));
        this.elements.stepSlider.addEventListener('input', () => this.handleSliderChange());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
            if (isTyping) return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.handleStepBack();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.handleStepForward();
            } else if (e.code === 'Space') {
                e.preventDefault();
                this.handlePlayPause();
            }
        });

        // Enter key on inputs
        this.elements.insertInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleInsert();
            }
        });

        this.elements.deleteInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleDelete();
            }
        });
    }

    // Toggle autoplay of steps
    handlePlayPause() {
        if (this.elements.playPauseBtn.disabled) return;

        if (this.isPlaying) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }
    }

    startPlayback() {
        if (this.isPlaying) return;

        // If we are already at the end, restart from the beginning
        if (this.pseudocode.currentStepIndex >= this.pseudocode.steps.length - 1) {
            this.jumpToStep(0);
        }

        this.isPlaying = true;
        this.elements.playPauseBtn.textContent = '⏸ Pause';

        this.playInterval = setInterval(() => {
            const advanced = this.handleStepForward();
            if (!advanced) {
                this.stopPlayback();
            }
        }, this.playDelay);
    }

    stopPlayback() {
        this.isPlaying = false;
        this.elements.playPauseBtn.textContent = '▶ Play';
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
    }

    // Sync range slider and labels when user scrubs
    handleSliderChange() {
        const value = parseInt(this.elements.stepSlider.value, 10);
        const targetIndex = Math.max(0, Math.min(this.pseudocode.steps.length - 1, value - 1));
        this.pseudocode.goToStep(targetIndex);
        this.afterStepChanged();
    }

    // Jump to a specific step
    jumpToStep(index) {
        this.stopPlayback();
        this.pseudocode.goToStep(index);
        this.afterStepChanged();
    }

    // Handle step backward
    handleStepBack() {
        this.stopPlayback();
        if (this.pseudocode.stepBackward()) {
            this.afterStepChanged();
            return true;
        }
        return false;
    }

    // Handle step forward
    handleStepForward() {
        if (this.pseudocode.stepForward()) {
            this.afterStepChanged();
            return true;
        }
        return false;
    }

    // Handle insert operation
    handleInsert() {
        const value = parseInt(this.elements.insertInput.value);
        if (isNaN(value)) {
            this.showStatus('Please enter a valid number', 'error');
            return;
        }

        const steps = this.tree.insert(value);
        this.pseudocode.loadSteps(steps);
        this.configureStepperForSteps();
        this.elements.insertInput.value = '';
        this.showStatus(`Inserted ${value} - Scrub the slider, use arrows, or hit Play to step through.`, 'success');
        this.updateUI();
        this.afterStepChanged();
    }

    // Handle delete operation
    handleDelete() {
        const value = parseInt(this.elements.deleteInput.value);
        if (isNaN(value)) {
            this.showStatus('Please enter a valid number to delete', 'error');
            return;
        }

        const steps = this.tree.delete(value);
        this.pseudocode.loadSteps(steps);
        this.configureStepperForSteps();
        this.elements.deleteInput.value = '';
        this.showStatus(`Deleted ${value} - Scrub the slider, use arrows, or hit Play to step through.`, 'success');
        this.updateUI();
        this.afterStepChanged();
    }

    // Handle delete minimum operation
    handleDeleteMin() {
        const steps = this.tree.deleteMin();
        this.pseudocode.loadSteps(steps);
        this.configureStepperForSteps();
        this.showStatus('Deleted minimum - Scrub the slider, use arrows, or hit Play to step through.', 'success');
        this.updateUI();
        this.afterStepChanged();
    }

    // Handle clear tree
    handleClear() {
        this.tree.clear();
        this.pseudocode.clear();
        this.visualizer.visualize(null);
        this.stopPlayback();
        this.resetStepper();
        this.showStatus('Tree cleared', 'success');
        this.updateUI();
    }

    // Update visualization at current step
    updateVisualizationAtCurrentStep() {
        const step = this.pseudocode.getCurrentStep();
        if (step && step.treeState) {
            this.visualizer.update(step.treeState, 250, step.variables || {}, step.floatingNodes || []);
        }
    }

    // Update labels and visualization after step change
    afterStepChanged() {
        this.updateVisualizationAtCurrentStep();
        this.updateStepButtons();
        this.updateStepSlider();
        this.updateStepSummary();
    }

    // Initialize or reset stepper controls when a new run is loaded
    configureStepperForSteps() {
        this.stopPlayback();
        const total = this.pseudocode.steps.length;
        this.elements.stepSlider.max = Math.max(1, total);
        this.elements.stepSlider.value = 1;
        this.updateStepSlider();
        this.updateStepButtons();
        this.updateStepSummary();
    }

    resetStepper() {
        this.elements.stepSlider.disabled = true;
        this.elements.stepSlider.value = 1;
        this.elements.stepLabel.textContent = 'Step 0 / 0';
        this.elements.stepSummary.textContent = 'Run an operation to see each step.';
        ['stepStartBtn', 'stepBackBtn', 'playPauseBtn', 'stepForwardBtn', 'stepEndBtn'].forEach((key) => {
            this.elements[key].disabled = true;
        });
    }

    // Update step button states
    updateStepButtons() {
        const total = this.pseudocode.steps.length;
        const atStart = this.pseudocode.currentStepIndex === 0;
        const atEnd = this.pseudocode.currentStepIndex >= total - 1;

        this.elements.stepStartBtn.disabled = total === 0 || atStart;
        this.elements.stepBackBtn.disabled = total === 0 || atStart;
        this.elements.stepForwardBtn.disabled = total === 0 || atEnd;
        this.elements.stepEndBtn.disabled = total === 0 || atEnd;
        this.elements.playPauseBtn.disabled = total <= 1;
        this.elements.stepSlider.disabled = total === 0;

        if (atEnd && this.isPlaying) {
            this.stopPlayback();
        }
    }

    updateStepSlider() {
        const total = this.pseudocode.steps.length;
        const displayCurrent = total === 0 ? 0 : this.pseudocode.currentStepIndex + 1;
        const sliderValue = total === 0 ? 1 : displayCurrent;
        this.elements.stepSlider.max = Math.max(1, total);
        this.elements.stepSlider.value = sliderValue;
        this.elements.stepLabel.textContent = `Step ${displayCurrent} / ${total}`;
    }

    updateStepSummary() {
        const step = this.pseudocode.getCurrentStep();
        if (!step) {
            this.elements.stepSummary.textContent = 'Run an operation to see each step.';
            return;
        }

        const lineText = this.pseudocode.getCurrentLineText();
        const callStack = step.callStack && step.callStack.length
            ? step.callStack.map((c) => c.funcName).join(' → ')
            : 'main';

        this.elements.stepSummary.textContent = `${step.funcName} · ${lineText || 'tracking state'} · Stack: ${callStack}`;
    }

    // Update UI elements
    updateUI() {
        const stats = this.tree.getStats();
        this.elements.nodeCount.textContent = stats.nodeCount;
        this.elements.treeHeight.textContent = stats.height;
    }

    // Show status message
    showStatus(message, type = 'info') {
        this.elements.operationStatus.textContent = message;
        this.elements.operationStatus.style.color = type === 'error' ? '#ff0000' : '#666';

        setTimeout(() => {
            this.elements.operationStatus.textContent = '';
        }, 4000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LLRBApp();
});
