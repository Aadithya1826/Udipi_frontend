import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AgentButton.css';

const AgentButton = () => {
  const navigate = useNavigate();

  return (
    <div className="agent-floating-btn" onClick={() => navigate('/agent')} title="Talk to Agent">
      <div className="agent-bubble-hint">
        Hi! I'm your AI Assistant. How can I help?
      </div>
      <img src="/agentwaiter logo.png" alt="AI Agent" className="agent-mascot-img" />
    </div>
  );
};

export default AgentButton;
