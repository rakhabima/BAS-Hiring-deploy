import React, { useEffect, useState } from 'react';

const TestAPI = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/')
      .then(res => res.text())
      .then(data => setMessage(data))
      .catch(err => setMessage('Error: ' + err.message));
  }, []);

  return (
    <div>
      <h1>Test API</h1>
      <p>{message}</p>
    </div>
  );
};

export default TestAPI;
