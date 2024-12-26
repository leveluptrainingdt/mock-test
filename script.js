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

    function getTestDuration(testType) {
        const instructions = mockTestInstructions[testType.toLowerCase()];
        if (!instructions || !instructions.duration) {
            return 30; // fallback duration in minutes
        }
        // Parse duration string to get minutes
        const minutes = parseInt(instructions.duration);
        return isNaN(minutes) ? 30 : minutes;
    }

    startButton.addEventListener('click', () => {
        const testType = testTypeSelect.value;
        const minutes = getTestDuration(testType);
        startModal.style.display = 'none';
        testStarted = true;
        startTimer(minutes);
        loadSavedCode();
        loadInstructions(currentLanguage);
    });

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

    // Function to evaluate HTML code and return score details
    function evaluateHtmlCode(code) {
        const requirements = {
            basicStructure: {
                points: 5,
                check: (code) => {
                    return code.includes('<!DOCTYPE html>') && 
                           code.includes('<html') && 
                           code.includes('<head') && 
                           code.includes('<title') && 
                           code.includes('<body') &&
                           /<h[1-6]/.test(code);
                }
            },
            textFormatting: {
                points: 5,
                check: (code) => {
                    return code.includes('<p') && 
                           (code.includes('<strong') || code.includes('<b')) && 
                           (code.includes('<em') || code.includes('<i'));
                }
            },
            unorderedList: {
                points: 5,
                check: (code) => {
                    const ulMatch = code.match(/<ul>.*?<\/ul>/s);
                    if (!ulMatch) return false;
                    const listItems = ulMatch[0].match(/<li/g);
                    return listItems && listItems.length >= 3;
                }
            },
            image: {
                points: 5,
                check: (code) => {
                    return /<img[^>]+src=["'][^"']+["'][^>]*alt=["'][^"']*["'][^>]*>/.test(code);
                }
            },
            link: {
                points: 5,
                check: (code) => {
                    // Create a temporary container to parse the HTML
                    const tempContainer = document.createElement('div');
                    tempContainer.innerHTML = code;
                    
                    // Find all anchor tags
                    const links = tempContainer.getElementsByTagName('a');
                    
                    // Check each link for the exact requirements
                    for (let link of links) {
                        if (link.href.includes('https://www.example.com') && 
                            link.textContent.toLowerCase().trim() === 'visit example') {
                            return true;
                        }
                    }
                    return false;
                }
            },
            table: {
                points: 10,
                check: (code) => {
                    return code.includes('<table') && 
                           code.includes('<th') && 
                           code.includes('<tr') && 
                           code.includes('<td');
                }
            },
            orderedList: {
                points: 5,
                check: (code) => {
                    const olMatch = code.match(/<ol>.*?<\/ol>/s);
                    if (!olMatch) return false;
                    const listItems = olMatch[0].match(/<li/g);
                    return listItems && listItems.length >= 4;
                }
            },
            semanticStructure: {
                points: 10,
                check: (code) => {
                    let count = 0;
                    if (code.includes('<nav')) count++;
                    if (code.includes('<article')) count++;
                    if (code.includes('<aside')) count++;
                    return count >= 2;
                }
            },
            iframe: {
                points: 10,
                check: (code) => {
                    return /<iframe[^>]+src=["'][^"']+["'][^>]*>/.test(code);
                }
            },
            form: {
                points: 15,
                check: (code) => {
                    return code.includes('<form') && 
                           code.includes('type="text"') && 
                           code.includes('type="email"') && 
                           code.includes('type="number"') && 
                           code.includes('type="submit"');
                }
            },
            audio: {
                points: 10,
                check: (code) => {
                    return /<audio[^>]*?(>.*?<source[^>]+src=["'][^"']+["'][^>]*>.*?<\/audio>|src=["'][^"']+["'][^>]*>)/is.test(code);
                }
            },
                  
            dataAttribute: {
                points: 5,
                check: (code) => {
                    return /data-[^=]+=['"][^'"]*['"]/.test(code);
                }
            },
            svgAndCanvas: {
                points: 10,
                check: (code) => {
                    return code.includes('<svg') && 
                           code.includes('<circle') && 
                           code.includes('<canvas');
                }
            }
        };
    
        let totalPoints = 0;
        let earnedPoints = 0;
        let results = [];
    
        // Evaluate each requirement
        for (const [key, requirement] of Object.entries(requirements)) {
            totalPoints += requirement.points;
            const passed = requirement.check(code);
            if (passed) {
                earnedPoints += requirement.points;
            }
            results.push({
                requirement: key,
                points: requirement.points,
                passed: passed
            });
        }
    
        const percentage = (earnedPoints / totalPoints) * 100;
        const passed = percentage >= 60; // Pass mark is 60%
    
        return {
            earnedPoints,
            totalPoints,
            percentage,
            passed,
            results
        };
    }
    
// Function to display evaluation results
function showEvaluationResults(evaluation) {
    // Remove any existing result modal first
    const existingModal = document.querySelector('.evaluation-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'modal evaluation-modal';
    
    const resultColor = evaluation.passed ? '#00c853' : '#ff4444';
    const resultText = evaluation.passed ? 'PASSED' : 'FAILED';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <h2 style="color: ${resultColor}; margin-bottom: 20px;">Test Result: ${resultText}</h2>
            <div class="score-summary" style="margin-bottom: 20px; text-align: left;">
                <p>Total Score: ${evaluation.earnedPoints}/${evaluation.totalPoints} (${evaluation.percentage.toFixed(1)}%)</p>
                <div class="progress-bar" style="margin: 10px 0; background-color: #eee; height: 20px; border-radius: 10px; overflow: hidden;">
                    <div style="width: ${evaluation.percentage}%; background-color: ${resultColor}; height: 100%;"></div>
                </div>
            </div>
            
            <div class="requirement-details" style="text-align: left;">
                <h3>Detailed Requirements:</h3>
                <div style="max-height: 300px; overflow-y: auto; margin-top: 10px;">
                    ${evaluation.results.map(result => `
                        <div class="requirement-item" style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                            <span>${result.requirement} (${result.points} points)</span>
                            <span style="color: ${result.passed ? '#00c853' : '#ff4444'}">
                                ${result.passed ? '✓' : '✗'}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                <button onclick="this.closest('.modal').remove()" class="submit-btn">
                    Close
                </button>
                <button onclick="location.reload()" class="submit-btn" style="background-color: var(--warning-color);">
                    Start New Test
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}


submitButton.addEventListener('click', () => {
    const code = codeInput.value;
    const evaluation = evaluateHtmlCode(code);
    showEvaluationResults(evaluation);
    
    // Simply disable the code editor
    codeInput.disabled = true;
    
    // Rest of your existing submission logic
    if (testStarted) {
        clearInterval(timerInterval);
        testStarted = false;
        localStorage.removeItem('testCode');
    }
    
    submissionStatus.textContent = 'Test submitted successfully';
    submissionStatus.style.backgroundColor = 'var(--success-color)';
    submissionStatus.style.color = 'white';
    submissionStatus.style.padding = '10px';
    submissionStatus.style.borderRadius = '4px';
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
// Fullscreen functionality
const fullscreenBtn = document.getElementById('fullscreen-btn');
const testArea = document.querySelector('.test-area');

fullscreenBtn.addEventListener('click', () => {
    testArea.classList.toggle('fullscreen');
    
    // Update button icon and text
    const icon = fullscreenBtn.querySelector('i');
    const span = fullscreenBtn.querySelector('span');
    
    if (testArea.classList.contains('fullscreen')) {
        icon.classList.remove('fa-expand');
        icon.classList.add('fa-compress');
        span.textContent = 'Exit Fullscreen';
    } else {
        icon.classList.add('fa-expand');
        icon.classList.remove('fa-compress');
        span.textContent = 'Fullscreen';
    }
});

// Handle ESC key to exit fullscreen
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && testArea.classList.contains('fullscreen')) {
        fullscreenBtn.click();
    }
});

// Preserve editor content when toggling fullscreen
fullscreenBtn.addEventListener('click', () => {
    // Force re-render of the preview
    if (codeInput.value) {
        updatePreview();
    }
});

// Adjust preview frame height on window resize
window.addEventListener('resize', () => {
    if (testArea.classList.contains('fullscreen')) {
        const previewFrame = document.getElementById('preview-frame');
        const codeInput = document.getElementById('code-input');
        const newHeight = window.innerHeight - 200;
        previewFrame.style.height = `${newHeight}px`;
        codeInput.style.height = `${newHeight}px`;
    }
});
    codeInput.addEventListener('copy', (e) => e.preventDefault());
    codeInput.addEventListener('cut', (e) => e.preventDefault());
    // codeInput.addEventListener('paste', (e) => e.preventDefault());

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