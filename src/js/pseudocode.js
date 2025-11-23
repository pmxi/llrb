// Pseudocode Display with Static Algorithm Code

class PseudocodeDisplay {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.steps = [];
        this.currentStepIndex = 0;
        this.currentAlgorithm = null;
    }

    // Load execution steps
    loadSteps(steps) {
        this.steps = steps;
        this.currentStepIndex = 0;
        if (steps.length > 0) {
            this.currentAlgorithm = steps[0].funcName;
        }
        this.render();
    }

    // Navigate to specific step
    goToStep(index) {
        if (index < 0 || index >= this.steps.length) return;
        this.currentStepIndex = index;
        this.render();
    }

    // Step forward
    stepForward() {
        if (this.currentStepIndex < this.steps.length - 1) {
            this.currentStepIndex++;
            this.render();
            return true;
        }
        return false;
    }

    // Step backward
    stepBackward() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.render();
            return true;
        }
        return false;
    }

    // Get current step
    getCurrentStep() {
        return this.steps[this.currentStepIndex];
    }

    // Get current line text for summary labels
    getCurrentLineText() {
        const step = this.getCurrentStep();
        if (!step || step.lineNumber === undefined || step.lineNumber < 0) return '';

        const algorithm = PARSED_ALGORITHMS[step.funcName];
        if (!algorithm) return '';

        const line = algorithm[step.lineNumber];
        return line ? line.text.trim() : '';
    }

    // Render the display
    render() {
        if (this.steps.length === 0) {
            this.container.innerHTML = '<p class="info-text">Perform an operation to see algorithm execution</p>';
            return;
        }

        const currentStep = this.steps[this.currentStepIndex];
        const algorithm = PARSED_ALGORITHMS[currentStep.funcName];

        if (!algorithm) {
            this.container.innerHTML = '<p class="info-text">Loading algorithm...</p>';
            return;
        }

        let html = '<div class="algorithm-container">';

        // Execution info bar at top
        html += '<div class="execution-bar">';

        // Call stack
        html += '<div class="exec-section">';
        html += '<span class="exec-label">Call Stack:</span> ';
        if (currentStep.callStack && currentStep.callStack.length > 0) {
            const frames = currentStep.callStack.map((call, index) => {
                const depth = '→'.repeat(index);
                const params = JSON.stringify(call.params).slice(1, -1);
                return `${depth}${call.funcName}(${params})`;
            }).join(' ');
            html += `<span class="exec-value">${frames}</span>`;
        } else {
            html += '<span class="exec-value">main()</span>';
        }
        html += '</div>';

        // Variables
        html += '<div class="exec-section">';
        html += '<span class="exec-label">Variables:</span> ';
        if (currentStep.variables && Object.keys(currentStep.variables).length > 0) {
            const vars = Object.entries(currentStep.variables)
                .map(([name, value]) => `${name}=${value}`)
                .join(', ');
            html += `<span class="exec-value">${vars}</span>`;
        } else {
            html += '<span class="exec-value">-</span>';
        }
        html += '</div>';

        // Step counter
        html += '<div class="exec-section step-counter">';
        html += `<span class="exec-label">Step ${this.currentStepIndex + 1} / ${this.steps.length}</span>`;
        html += '</div>';

        html += '</div>'; // execution-bar

        // Algorithm code
        html += '<div class="algorithm-code">';
        html += `<div class="algorithm-title">${currentStep.funcName}()</div>`;

        algorithm.forEach((line, index) => {
            const isCurrentLine = index === currentStep.lineNumber;
            const lineClass = isCurrentLine ? 'code-line active' : 'code-line';
            const spaces = '&nbsp;'.repeat(line.indent);

            html += `<div class="${lineClass}">`;
            html += `<span class="line-number">${(index + 1).toString().padStart(2, ' ')}</span>`;
            html += `<span class="line-text">${spaces}${this.escapeHtml(line.text)}</span>`;
            html += '</div>';
        });

        html += '</div>'; // algorithm-code
        html += '</div>'; // algorithm-container

        this.container.innerHTML = html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Clear display
    clear() {
        this.steps = [];
        this.currentStepIndex = 0;
        this.currentAlgorithm = null;
        this.render();
    }
}
