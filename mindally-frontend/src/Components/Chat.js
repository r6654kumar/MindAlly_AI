import React, { useState } from 'react';
import axios from 'axios';
import './Chat.css';
const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    const userMessage = { text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await axios.post('http://localhost:5000/chat', {
        message: input,
        userId: 'test_Rahul', // TODO DYNAMIC
      });

      const botMessage = { text: response.data.reply, sender: 'bot' };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { text: 'An error occurred. Please try again.', sender: 'bot' };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setInput('');
    setIsLoading(false);
  };

  return (
    <div className="chatContainer">
      <div className="messagesContainer">
        {messages.map((msg, index) => (
          <div key={index} className={msg.sender === 'user' ? 'userMessage' : 'botMessage'}>
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="botMessage typingIndicator">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        )}
      </div>
      <div className="inputContainer">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="input"
          placeholder="Type a message..."
        />
        <button onClick={handleSend} className="sendButton">
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;