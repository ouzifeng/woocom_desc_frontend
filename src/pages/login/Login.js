import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    // ...existing login logic...

    // After successful login
    navigate('/dashboard');
  };

  return (
    <form onSubmit={handleLogin}>
      {/* ...existing form elements... */}
      <button type="submit">Login</button>
    </form>
  );
}