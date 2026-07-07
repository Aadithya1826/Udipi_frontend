import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AgentButton.css';
import agentwaiterLogoImg from '../assets/images/agentwaiter_logo.png';

const AgentButton = () => {
  const navigate = useNavigate();

  return (
    <div className="agent-floating-btn" onClick={() => navigate('/agent')} title="Talk to Agent">
      <div className="agent-bubble-hint">
        Hi! I'm your AI Assistant. How can I help?
      </div>
      <img src={agentwaiterLogoImg} alt="AI Agent" className="agent-mascot-img" />
    </div>
  );
};

export default AgentButton;
