const chatContainer = document.getElementById('chatContainer');
  const inputText = document.getElementById('inputText');
  const sendBtn = document.getElementById('sendBtn');
  const newChatBtn = document.getElementById('newChatBtn');
  const historyList = document.getElementById('historyList');
  const sidebar = document.getElementById('sidebar');
  const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');

  const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

  let chatHistory = [];
  let currentChatId = null;

  function appendMessage(role, text) {
    const message = document.createElement('div');
    message.className = `message ${role}-message`;

    const avatar = document.createElement('div');
    avatar.className = `avatar ${role}-avatar`;
    avatar.textContent = role === 'user' ? 'U' : 'AI';

    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = text;

    message.appendChild(avatar);
    message.appendChild(content);
    chatContainer.appendChild(message);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function saveToLocalStorage() {
    localStorage.setItem('chatSessions', JSON.stringify(chatHistory));
  }

  function loadHistoryMenu() {
    historyList.innerHTML = '';
    chatHistory.forEach((chat, index) => {
      const btn = document.createElement('button');
      btn.textContent = chat.title;
      btn.onclick = () => loadChat(index);
      historyList.appendChild(btn);
    });
  }

  function loadChat(index) {
    const chat = chatHistory[index];
    currentChatId = index;
    chatContainer.innerHTML = '';
    chat.messages.forEach(msg => {
      appendMessage(msg.role, msg.text);
    });
  }

  function startNewChat() {
    currentChatId = null;
    chatContainer.innerHTML = `
      <div class="message ai-message">
        <div class="avatar ai-avatar">AI</div>
        <div class="message-content">Hello! How can I assist you today?</div>
      </div>
    `;
  }

  async function getAIResponse(userInput) {
    if (!userInput.trim()) return;

    appendMessage('user', userInput);
    inputText.value = '';

    if (currentChatId === null) {
      chatHistory.push({
        title: "New Chat",
        messages: []
      });
      currentChatId = chatHistory.length - 1;
    }

    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'message ai-message';
    loadingMsg.innerHTML = `
      <div class="avatar ai-avatar">AI</div>
      <div class="message-content loading">Typing...</div>
    `;
    chatContainer.appendChild(loadingMsg);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch("/api/groq", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: userInput })
          });
          
          const data = await response.json();
          const aiText = data.reply.trim();
          
      chatContainer.removeChild(loadingMsg);
      appendMessage('ai', aiText);

      chatHistory[currentChatId].messages.push({ role: 'user', text: userInput });
      chatHistory[currentChatId].messages.push({ role: 'ai', text: aiText });

      if (chatHistory[currentChatId].title === "New Chat") {
        chatHistory[currentChatId].title = userInput.length > 20 ? userInput.slice(0, 20) + "..." : userInput;
      }

      loadHistoryMenu();
      saveToLocalStorage();
    } catch (error) {
      chatContainer.removeChild(loadingMsg);
      appendMessage('ai', "❌ Error getting response. Please try again.");
      console.error("API Error:", error);
    }
  }

  sendBtn.addEventListener('click', () => {
    const message = inputText.value.trim();
    getAIResponse(message);
  });

  inputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  newChatBtn.addEventListener('click', startNewChat);
  toggleHistoryBtn.addEventListener('click', () => sidebar.classList.toggle('hidden'));

  window.onload = () => {
    const stored = localStorage.getItem('chatSessions');
    if (stored) {
      chatHistory = JSON.parse(stored);
      loadHistoryMenu();
    }
    startNewChat();
  };