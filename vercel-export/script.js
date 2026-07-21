/**
 * Frontend script to handle LOKI x PRIME chat interactions
 * Connects to the Vercel Serverless Function at /api/chat
 */

// Function to send the message to the backend
async function sendChatMessage(message, slot) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, slot })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch response');
    }

    return data.response;
  } catch (error) {
    console.error('Error:', error);
    return 'Sorry, an error occurred while processing your request.';
  }
}

// Example Implementation
document.addEventListener('DOMContentLoaded', () => {
  const sendBtn = document.getElementById('sendBtn');
  const userInput = document.getElementById('userInput');
  const slotSelect = document.getElementById('slotSelect'); // e.g., <select> with values '1', '2', '3'
  const chatDisplay = document.getElementById('chatDisplay');

  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      const message = userInput.value.trim();
      const slot = slotSelect.value;
      
      if (!message) return;

      // 1. Display user message
      chatDisplay.innerHTML += `<div><strong>You:</strong> ${message}</div>`;
      userInput.value = '';

      // 2. Show loading state
      const loadingId = 'loading-' + Date.now();
      chatDisplay.innerHTML += `<div id="${loadingId}"><em>LOKI x PRIME is thinking...</em></div>`;

      // 3. Fetch response from Vercel backend
      const reply = await sendChatMessage(message, slot);

      // 4. Remove loading state and display response
      document.getElementById(loadingId).remove();
      chatDisplay.innerHTML += `<div><strong>LOKI x PRIME:</strong> ${reply}</div>`;
      
      // Auto-scroll to bottom
      chatDisplay.scrollTop = chatDisplay.scrollHeight;
    });
  }
});
