// ==========================================
// CONFIGURATION - Set your n8n webhook URL here
// ==========================================
const N8N_WEBHOOK_URL = 'https://youtube-video-summarizer-n8n.onrender.com/webhook/youtube-video-summarizer'; // Replace with your n8n webhook URL

// DOM Elements
const youtubeUrlInput = document.getElementById('youtubeUrl');
const summarizeBtn = document.getElementById('summarizeBtn');
const clearBtn = document.getElementById('clearBtn');
const outputSection = document.getElementById('outputSection');
const copyBtn = document.getElementById('copyBtn');
const titleOutput = document.getElementById('titleOutput');
const summaryOutput = document.getElementById('summaryOutput');
const keyMessageOutput = document.getElementById('keyMessageOutput');
const toneOutput = document.getElementById('toneOutput');
const toast = document.getElementById('toast');

// Event Listeners
summarizeBtn.addEventListener('click', handleSummarize);
clearBtn.addEventListener('click', handleClear);
copyBtn.addEventListener('click', handleCopy);

// Validate YouTube URL
function isValidYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
}

// Extract video ID from YouTube URL
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Main Summarize Function
async function handleSummarize() {
    const url = youtubeUrlInput.value.trim();
    
    if (!url) {
        showToast('Please enter a YouTube URL', 'error');
        return;
    }

    if (!isValidYouTubeUrl(url)) {
        showToast('Please enter a valid YouTube URL', 'error');
        return;
    }

    // Show loading state
    summarizeBtn.classList.add('loading');
    summarizeBtn.disabled = true;

    try {
        // Call n8n webhook
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                videoId: extractVideoId(url)
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Display results from n8n
        displayResults(data);
        
        showToast('Summary generated successfully!', 'success');
    } catch (error) {
        showToast('Error generating summary. Please try again.', 'error');
        console.error('Error:', error);
    } finally {
        summarizeBtn.classList.remove('loading');
        summarizeBtn.disabled = false;
    }
}

// Display results in the UI
function displayResults(data) {
    // Log the response to see its structure
    console.log('n8n Response:', data);
    console.log('Response type:', typeof data);

    // Handle if response is an array (n8n sometimes returns array)
    let responseData = data;
    if (Array.isArray(data)) {
        responseData = data[0] || {};
        console.log('Data was array, using first element:', responseData);
    }

    // Handle if response has a 'text' field containing JSON string (from LLM Chain)
    if (responseData.text && typeof responseData.text === 'string') {
        try {
            // Try to parse the text field as JSON
            responseData = JSON.parse(responseData.text);
            console.log('Parsed text field as JSON:', responseData);
        } catch (e) {
            console.log('Text field is not JSON, using as-is');
        }
    }

    // Handle nested output structure (e.g., data.output or data.result)
    if (responseData.output) {
        responseData = responseData.output;
        console.log('Found nested output:', responseData);
    }
    if (responseData.result) {
        responseData = responseData.result;
        console.log('Found nested result:', responseData);
    }
    if (responseData.data) {
        responseData = responseData.data;
        console.log('Found nested data:', responseData);
    }

    // Handle different response formats from n8n
    const title = responseData.video_based_on || responseData.title || responseData.Title || responseData['Title:'] || responseData['Title'] || 'Video Summary';
    const summary = responseData.summary || responseData.Summary || responseData['Summary:'] || responseData['Summary'] || '';
    const keyMessage = responseData.key_message || responseData.keyMessage || responseData['Key Message'] || responseData['Key Message:'] || responseData['key message'] || '';
    const tone = responseData.tone || responseData.Tone || responseData['Tone:'] || responseData['Tone'] || 'neutral';

    console.log('Parsed values:', { title, summary, keyMessage, tone });

    titleOutput.textContent = title;
    
    // Handle summary - could be plain text or HTML
    if (summary.includes('<p>') || summary.includes('<br>')) {
        summaryOutput.innerHTML = summary;
    } else {
        summaryOutput.innerHTML = `<p>${summary}</p>`;
    }
    
    keyMessageOutput.textContent = keyMessage;
    
    toneOutput.textContent = tone;
    toneOutput.className = `tone-badge ${tone.toLowerCase()}`;
    
    outputSection.classList.remove('hidden');
    
    // Scroll to results
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
languageSelect.value = 'english';
    
// Clear all inputs and outputs
function handleClear() {
    youtubeUrlInput.value = '';
    outputSection.classList.add('hidden');
    titleOutput.textContent = '';
    summaryOutput.innerHTML = '';
    keyMessageOutput.textContent = '';
    toneOutput.textContent = '';
    toneOutput.className = 'tone-badge';
    
    showToast('Cleared successfully', 'success');
}

// Copy summary to clipboard
async function handleCopy() {
    const summaryText = `Title:\n${titleOutput.textContent}\n\nSummary:\n${summaryOutput.textContent}\n\nKey Message:\n${keyMessageOutput.textContent}\n\nTone:\n${toneOutput.textContent}`;
    
    try {
        await navigator.clipboard.writeText(summaryText);
        showToast('Summary copied to clipboard!', 'success');
    } catch (error) {
        showToast('Failed to copy. Please try again.', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Helper function to capitalize first letter
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Keyboard shortcut: Enter to summarize when focused on URL input
youtubeUrlInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        handleSummarize();
    }
});

// Keyboard shortcut: Ctrl+Enter to summarize from anywhere
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        handleSummarize();
    }
});
