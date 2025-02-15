import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null); 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    const userMessage = { text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        message: input,
        userId: 'test_2', // TODO: Make this dynamic
      });

      const botMessage = { text: response.data.reply, sender: 'bot' };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
        text: error.response?.data?.error || 'An error occurred. Please try again.', 
        sender: 'bot' 
      };
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
        <div ref={messagesEndRef} />
      </div>
      <div className="inputContainer">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="input"
          placeholder="Type a message..."
        />
        <button onClick={handleSend} className="sendButton" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default Chat;
