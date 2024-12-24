import { mockTestInstructions } from './instruction.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startModal = document.getElementById('start-modal');
    const startButton = document.getElementById('start-test');
    const timeLimitSelect = document.getElementById('time-limit');
    const themeSwitch = document.getElementById('theme-switch');
    const fontSizeSelect = document.getElementById('font-size');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const codeInput = document.getElementById('code-input');
    const previewFrame = document.getElementById('preview-frame');
    const submitButton = document.getElementById('submit-test');
    const submissionStatus = document.getElementById('submission-status');
    const progressBar = document.getElementById('test-progress');
    const timerDisplay = document.getElementById('timer');
    const testTypeSelect = document.getElementById('test-type');
    const instructionContent = document.querySelector('.instruction-content');

    // State variables
    let timeLeft = 0;
    let timerInterval;
    let tabSwitchCount = 0;
    let testStarted = false;
    let currentLanguage = 'html';

    // Check device type immediately
    checkDeviceType();

    // Initialize compiler state
    let compilerState = {
        html: '',
        css: '',
        js: ''
    };

    // Load instructions based on test type
    function loadInstructions(testType) {
        try {
            const instructions = mockTestInstructions[testType.toLowerCase()];
            if (!instructions) {
                console.error('No instructions found for test type:', testType);
                return;
            }

            let html = `
                <div class="instructions-container">
                    <div class="instruction-header">
                        <h2>${instructions.title}</h2>
                        <p class="duration">Duration: ${instructions.duration}</p>
                        <p>${instructions.overview}</p>
                    </div>
            `;

            instructions.sections.forEach(section => {
                html += `
                    <div class="instruction-section">
                        <h3><i class="fas fa-info-circle"></i> ${section.title}</h3>
                        <div class="content-card">
                `;

                if (section.content) {
                    html += `<p>${section.content}</p>`;
                }

                if (section.items) {
                    html += '<ul>';
                    section.items.forEach(item => {
                        html += `<li><i class="fas fa-check-circle"></i> ${item}</li>`;
                    });
                    html += '</ul>';
                }

                html += `
                        </div>
                    </div>
                `;
            });

            html += '</div>';
            instructionContent.innerHTML = html;
        } catch (error) {
            console.error('Error loading instructions:', error);
            instructionContent.innerHTML = '<p>Error loading instructions. Please try refreshing the page.</p>';
        }
    }

    function showSubmissionModal(message, isAutoSubmit = false) {
        const modal = document.createElement('div');
        modal.className = 'modal submission-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${message}</h2>
                <button class="submit-btn" style="margin-top: 20px;">
                    ${isAutoSubmit ? 'OK' : 'Close'}
                </button>
            </div>
        `;
        
        const button = modal.querySelector('button');
        button.addEventListener('click', () => {
            if (isAutoSubmit) {
                window.location.reload();
            } else {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    function checkDeviceType() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /Tablet|iPad/i.test(navigator.userAgent);
        const screenWidth = window.innerWidth;
        
        if (isMobile || isTablet || screenWidth < 1024) {
            showDeviceModal();
            document.querySelector('.container').style.display = 'none';
        }
    }

    function showDeviceModal() {
        const deviceModal = document.createElement('div');
        deviceModal.className = 'modal device-modal';
        deviceModal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        deviceModal.innerHTML = `
            <div class="modal-content">
                <h2><i class="fas fa-desktop"></i> Desktop Only</h2>
                <p>This mock test platform is designed exclusively for desktop computers.</p>
                <p>Please access this test using a desktop or laptop computer with a minimum screen width of 1024px.</p>
                <p style="color: #ff4444; margin-top: 15px;">⚠️ Mobile and tablet devices are not supported.</p>
            </div>
        `;
        document.body.appendChild(deviceModal);
        deviceModal.style.display = 'flex';
    }

    // Initialize theme and font size
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    themeSwitch.value = savedTheme;

    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    document.body.style.fontSize = getFontSize(savedFontSize);
    fontSizeSelect.value = savedFontSize;

    themeSwitch.addEventListener('change', (e) => {
        const theme = e.target.value;
        document.body.classList.toggle('dark-theme', theme === 'dark');
        localStorage.setItem('theme', theme);
    });

    fontSizeSelect.addEventListener('change', (e) => {
        const size = e.target.value;
        document.body.style.fontSize = getFontSize(size);
        localStorage.setItem('fontSize', size);
    });

    function getFontSize(size) {
        const sizes = {
            small: '14px',
            medium: '16px',
            large: '18px'
        };
        return sizes[size] || sizes.medium;
    }

    testTypeSelect.addEventListener('change', (e) => {
        currentLanguage = e.target.value.toLowerCase();
        updateEditorMode();
        loadSavedCode();
        loadInstructions(currentLanguage);
    });

    function updateEditorMode() {
        codeInput.setAttribute('data-language', currentLanguage);
    }

    function compileCode(code) {
        const language = currentLanguage;
        compilerState[language] = code;
        
        let compiledHTML = '';
        
        if (language === 'html') {
            compiledHTML = code;
        } else {
            compiledHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>${compilerState.css}</style>
                </head>
                <body>
                    ${compilerState.html}
                    <script>${compilerState.js}</script>
                </body>
                </html>
            `;
        }
        
        return compiledHTML;
    }

    function updatePreview() {
        const code = codeInput.value;
        const compiledCode = compileCode(code);
        
        const previewDocument = previewFrame.contentDocument || previewFrame.contentWindow.document;
        previewDocument.open();
        previewDocument.write(compiledCode);
        previewDocument.close();
        
        previewFrame.onerror = (error) => {
            previewDocument.body.innerHTML = `
                <div style="color: red; padding: 10px;">
                    Error rendering preview: ${error.message}
                </div>
            `;
        };
    }

    let previewTimeout;
    codeInput.addEventListener('input', () => {
        clearTimeout(previewTimeout);
        previewTimeout = setTimeout(() => {
            updatePreview();
            saveProgress();
        }, 300);
    });

    function saveProgress() {
        const saveData = {
            code: codeInput.value,
            language: currentLanguage
        };
        localStorage.setItem('testCode', JSON.stringify(saveData));
    }

    function loadSavedCode() {
        const savedData = localStorage.getItem('testCode');
        if (savedData) {
            try {
                const { code, language } = JSON.parse(savedData);
                if (language === currentLanguage) {
                    codeInput.value = code;
                    updatePreview();
                }
            } catch (e) {
                console.error('Error loading saved code:', e);
            }
        }
    }

    function startTimer(minutes) {
        timeLeft = minutes * 60;
        progressBar.style.width = '100%';
        updateTimer();
        
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimer();
            updateProgress(minutes);

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                autoSubmitTest('Time expired');
            }
        }, 1000);
    }

    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${padZero(minutes)}:${padZero(seconds)}`;
    }

    function padZero(num) {
        return num.toString().padStart(2, '0');
    }

    function updateProgress(totalMinutes) {
        const totalSeconds = totalMinutes * 60;
        const progress = (timeLeft / totalSeconds) * 100;
        progressBar.style.width = `${progress}%`;
    }

    startButton.addEventListener('click', () => {
        const minutes = parseInt(timeLimitSelect.value);
        startModal.style.display = 'none';
        testStarted = true;
        startTimer(minutes);
        loadSavedCode();
        loadInstructions(currentLanguage);
    });

    submitButton.addEventListener('click', () => {
        submitTest('Test submitted successfully');
    });

    function submitTest(message) {
        clearInterval(timerInterval);
        testStarted = false;
        submissionStatus.textContent = message;
        submissionStatus.style.backgroundColor = 'var(--success-color)';
        submissionStatus.style.color = 'white';
        submissionStatus.style.padding = '10px';
        submissionStatus.style.borderRadius = '4px';
        submitButton.disabled = true;
        codeInput.disabled = true;
        localStorage.removeItem('testCode');
        showSubmissionModal(message, false);
    }

    function autoSubmitTest(reason) {
        submitTest(`Test automatically submitted: ${reason}`);
        if (reason === 'Multiple tab switches detected') {
            showSubmissionModal(`Test automatically submitted: ${reason}`, true);
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    function switchTab(tabId) {
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });
        
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === tabId);
        });

        if (tabId === 'editor') {
            updatePreview();
        }
    }

    codeInput.addEventListener('copy', (e) => e.preventDefault());
    codeInput.addEventListener('cut', (e) => e.preventDefault());
    codeInput.addEventListener('paste', (e) => e.preventDefault());

    document.addEventListener('visibilitychange', () => {
        if (testStarted && document.visibilityState === 'hidden') {
            tabSwitchCount++;
            
            if (tabSwitchCount <= 2) {
                showTabSwitchWarning();
            }
            
            if (tabSwitchCount >= 3) {
                autoSubmitTest('Multiple tab switches detected');
            }
        }
    });

    function showTabSwitchWarning() {
        const warningModal = document.createElement('div');
        warningModal.className = 'modal warning-modal';
        warningModal.innerHTML = `
            <div class="modal-content">
                <h2><i class="fas fa-exclamation-triangle"></i> Warning</h2>
                <p>Tab switching is not allowed during the test.</p>
                <p>Further violations will result in automatic submission.</p>
                <button onclick="this.closest('.modal').remove()">Understood</button>
            </div>
        `;
        document.body.appendChild(warningModal);
        warningModal.style.display = 'flex';
    }

    window.addEventListener('beforeunload', (e) => {
        if (testStarted) {
            e.preventDefault();
            e.returnValue = 'Are you sure you want to leave? Your test progress will be lost.';
            return e.returnValue;
        }
    });

    // Initial setup
    updateEditorMode();
    loadSavedCode();
    
    // Load initial instructions for the default test type
    const initialTestType = testTypeSelect.value;
    loadInstructions(initialTestType);
});