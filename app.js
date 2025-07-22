// Consultant scheduler app logic
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const form = document.getElementById('schedulerForm');
    const consultantSelect = document.getElementById('consultant');
    const emailInput = document.getElementById('email');
    const manualEventIdInput = document.getElementById('manualEventId');
    const generateBtn = document.getElementById('generateBtn');
    const resultSection = document.getElementById('result');
    const errorSection = document.getElementById('error');
    const generatedUrlInput = document.getElementById('generatedUrl');
    const copyBtn = document.getElementById('copyBtn');
    const customerInfoDiv = document.getElementById('customerInfo');
    const linkHistoryDiv = document.getElementById('linkHistory');
    const clearHistoryBtn = document.getElementById('clearHistory');

    // Load history on startup
    loadHistory();

    // Form submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Hide previous results/errors
        resultSection.style.display = 'none';
        errorSection.style.display = 'none';
        
        // Get form values
        const consultantId = consultantSelect.value;
        const consultantName = consultantSelect.options[consultantSelect.selectedIndex].text;
        const email = emailInput.value.trim();
        const manualEventId = manualEventIdInput.value.trim();
        
        if (!consultantId || !email) {
            showError('Please select a consultant and enter an email');
            return;
        }
        
        // Show loading state
        setLoading(true);
        
        try {
            let eventId = manualEventId;
            let customerName = null;
            
            // If no manual event ID, look it up
            if (!eventId) {
                const customerData = await lookupCustomer(email);
                if (customerData.success) {
                    eventId = customerData.eventId;
                    customerName = customerData.customerName;
                } else {
                    showError('Could not find event ID for this email. Please enter it manually.');
                    setLoading(false);
                    return;
                }
            }
            
            // Generate VideoAsk URL
            const videoAskUrl = `https://www.videoask.com/${consultantId}#event_id=${encodeURIComponent(eventId)}`;
            
            // Shorten URL
            const shortenedData = await shortenUrl(videoAskUrl, `Poppy - ${consultantName} - ${eventId}`);
            const finalUrl = shortenedData.shortUrl;
            
            // Display result
            showResult(finalUrl, eventId, customerName, email, consultantName);
            
            // Save to history
            saveToHistory({
                url: finalUrl,
                eventId,
                email,
                consultantName,
                customerName,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Error generating link:', error);
            showError('Failed to generate link. Please try again.');
        } finally {
            setLoading(false);
        }
    });

    // Copy button handler
    copyBtn.addEventListener('click', () => {
        generatedUrlInput.select();
        document.execCommand('copy');
        
        // Show feedback
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copied');
        }, 2000);
    });

    // Clear history handler
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Clear all link history?')) {
            localStorage.removeItem('linkHistory');
            loadHistory();
        }
    });

    // API Functions
    async function lookupCustomer(email) {
        const response = await fetch(`/api/customer/${encodeURIComponent(email)}`);
        const data = await response.json();
        return data;
    }

    async function shortenUrl(url, title) {
        const response = await fetch('/api/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url, title })
        });
        const data = await response.json();
        return data;
    }

    // UI Functions
    function setLoading(loading) {
        generateBtn.disabled = loading;
        generateBtn.querySelector('.btn-text').textContent = loading ? 'Generating...' : 'Generate Link';
        generateBtn.querySelector('.spinner').style.display = loading ? 'inline' : 'none';
    }

    function showResult(url, eventId, customerName, email, consultantName) {
        generatedUrlInput.value = url;
        
        // Show customer info if available
        if (customerName) {
            customerInfoDiv.innerHTML = `
                <p><strong>Customer:</strong> ${customerName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Event ID:</strong> ${eventId}</p>
            `;
        } else {
            customerInfoDiv.innerHTML = `
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Event ID:</strong> ${eventId}</p>
            `;
        }
        
        resultSection.style.display = 'block';
        
        // Auto-select the URL for easy copying
        generatedUrlInput.select();
    }

    function showError(message) {
        errorSection.querySelector('.error-message').textContent = message;
        errorSection.style.display = 'block';
    }

    // History Functions
    function saveToHistory(linkData) {
        const history = getHistory();
        history.unshift(linkData);
        
        // Keep only last 10 items
        if (history.length > 10) {
            history.pop();
        }
        
        localStorage.setItem('linkHistory', JSON.stringify(history));
        loadHistory();
    }

    function getHistory() {
        const stored = localStorage.getItem('linkHistory');
        return stored ? JSON.parse(stored) : [];
    }

    function loadHistory() {
        const history = getHistory();
        
        if (history.length === 0) {
            linkHistoryDiv.innerHTML = '<p class="empty-state">No recent links yet</p>';
            clearHistoryBtn.style.display = 'none';
        } else {
            linkHistoryDiv.innerHTML = history.map(item => `
                <div class="history-item">
                    <div class="history-info">
                        <strong>${item.consultantName}</strong> - ${item.email}
                        ${item.customerName ? `(${item.customerName})` : ''}
                        <br>
                        <small>${new Date(item.timestamp).toLocaleString()}</small>
                    </div>
                    <button class="btn-small" onclick="copyHistoryLink('${item.url}')">Copy</button>
                </div>
            `).join('');
            clearHistoryBtn.style.display = 'block';
        }
    }

    // Global function for history copy buttons
    window.copyHistoryLink = function(url) {
        // Create temporary input
        const tempInput = document.createElement('input');
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        // Show feedback (you could enhance this)
        alert('Link copied to clipboard!');
    };
});