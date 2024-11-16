
let saveAsPDFButton = document.getElementById('saveAsPDFButton');

document.addEventListener('DOMContentLoaded', () => {
    let saveAsPDFButton = document.getElementById('saveAsPDFButton');
    
    if (!saveAsPDFButton) {
        console.error('Save PDF button not found');
        return;
    }

    saveAsPDFButton.addEventListener("click", async () => {
        try {
            // Get current active tab
            let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                alert('No active tab found');
                return;
            }

            // Execute script with error handling
            const result = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: saveAsPDF,
            });

            if (!result) {
                alert('Failed to execute script');
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Failed to save PDF: ' + error.message);
        }
    });
});

function getMiddleText(text) {
    const parts = text.split('\n');
    const middleIndex = Math.floor(parts.length / 2);
    return parts[middleIndex];
}
function getFullText(text) {
    return text.trim().replace(/\n\s*\n/g, '\n'); 
}

function saveAsPDF() {
    function processText(text) {
        if (!text) return '';
        return text
            .trim()
            // Remove ChatGPT prefix and other unwanted text
            .replace(/^(ChatGPT:?\s*|4o\s*mini|ChatGPT\s*$)/gi, '')
            // Preserve intentional line breaks
            .replace(/\n{4,}/g, '\n\n\n')
            // Clean up whitespace while preserving formatting
            .replace(/[ \t]+/g, ' ')
            // Remove empty lines at start/end
            .trim();
    }
    

    const elements = document.querySelectorAll(".text-base");
    let content = "";
    let history = [];
    const date = new Date().toLocaleString();
    
    content += `<div class="header">
        <h1>GPToPDF-Export</h1>
        <p class="timestamp">Exported on ${date}</p>
    </div>`;

    for (const element of elements) {
        const textContent = element.querySelector('.whitespace-pre-wrap')?.innerText || element.innerText;
        let processedText = processText(textContent);
        
        if (!processedText) continue;

        const role = element.querySelector('svg[role="img"]') ? 'ChatGPT' : 'You';
        const messageClass = role === 'ChatGPT' ? 'ai-message' : 'user-message';
        
        const msg = `
        <div class="${messageClass} message-card">
            <div class="message-header">
                <div class="role-badge ${role.toLowerCase()}-badge">
                    ${role === 'ChatGPT' ? '🤖' : '👤'} <strong>${role}</strong>
                </div>
            </div>
            <div class="message-content">
                ${processedText}
            </div>
        </div>`;
            
        if (!history.includes(msg)) {
            content += msg;
            history.push(msg);
        }
    }

    if (content.trim() === "") {
        alert("Nothing found");
        return;
    }

    const printableHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
            <style>
            :root {
                --primary: #2563eb;
                --secondary: #3b82f6;
                --background: #ffffff;
                --text: #1f2937;
                --muted: #6b7280;
                --ai-msg: #f8fafc;
                --user-msg: #eff6ff;
                --border: #e5e7eb;
            }
            .footer {
                text-align: center;
                margin-top: 3rem;
                padding: 2rem;
                border-top: 1px solid var(--border);
                color: var(--muted);
            }

            .footer a {
                color: var(--primary);
                text-decoration: none;
                font-weight: 500;
            }

            .footer a:hover {
                text-decoration: underline;
            }

            @media print {
                .footer {
                display: none;
                }
            }

            body {
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
                line-height: 1.5; /* Reduced from 1.7 */
                max-width: 850px;
                margin: 0 auto;
                padding: 1rem; /* Reduced from 2rem */
                color: var(--text);
                background: var(--background);
            }

            .header {
                text-align: center;
                margin-bottom: 3rem;
                padding: 2rem;
                background: linear-gradient(135deg, #2563eb11 0%, #3b82f611 100%);
                border-radius: 16px;
                border: 1px solid var(--border);
            }

            .header h1 {
                color: var(--primary);
                margin: 0;
                font-size: 2.2rem;
                font-weight: 600;
                letter-spacing: -0.02em;
            }

            .timestamp {
                color: var(--muted);
                font-size: 0.95rem;
                margin-top: 0.5rem;
            }

            .message-card {
                background: white;
                border-radius: 16px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                margin-bottom: 16px; /* Reduced from 24px */
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            .role-badge {
                display: inline-flex;
                align-items: center;
                padding: 6px 12px; /* Reduced padding */
                border-radius: 6px;
                font-weight: 600;
                font-size: 0.9rem;
            }

            .message-content {
                padding: 12px 16px; /* Reduced padding */
                line-height: 1.5; /* Reduced from 1.8 */
                white-space: pre-wrap;
                overflow-wrap: break-word;
                word-wrap: break-word;
                min-height: min-content; /* Prevent empty space */
            }

            .message-header {
                padding: 12px 16px; /* Reduced padding */
                border-bottom: 1px solid var(--border);
                display: flex;
                align-items: center;
            }

            code {
                font-family: 'Fira Code', monospace;
                background: #1e1e1e;
                color: #d4d4d4;
                padding: 0.2em 0.4em;
                border-radius: 4px;
                font-size: 0.9em;
            }

            pre code {
                display: block;
                padding: 1rem;
                border-radius: 8px;
                overflow-x: auto;
            }

            @media print {
                body { font-size: 11pt; }
                .message-card {
                margin-bottom: 12px; /* Reduced margin for print */
                page-break-inside: avoid;
                }
                .message-content {
                padding: 10px 14px; /* Even more compact for print */
                }
                .header { 
                background: none;
                padding: 1rem;
                }
                @page {
                margin: 1in;
                size: A4;
                }
            }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
        `;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    iframe.onload = function() {
        try {
            iframe.contentWindow.print();
        } catch (error) {
            console.error('Printing failed:', error);
            alert('Failed to print: ' + error.message);
        }
        setTimeout(() => document.body.removeChild(iframe), 100);
    };

    iframe.contentDocument.write(printableHtml);
    iframe.contentDocument.close();
}



