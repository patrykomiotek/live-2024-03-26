'use client';

import { useEffect, useState } from 'react';

type Message = {
  type: string;
  payload: {
    message: string;
  };
};

export const Events = () => {
  const [messages, setMessages] = useState([]);

  const connectToStream = () => {
    const eventSource = new EventSource('/api/sse');
    eventSource.addEventListener('message', (event) => {
      // console.log({ event });
      const eventMessage: Message = JSON.parse(event.data);
      console.log({ eventMessage });
      setMessages((prevState) => [...prevState, eventMessage.type]);
    });

    // TODO: eventSource.addEventListener('error', callback)
    // TODO: eventSource.onclose

    return eventSource;
  };

  useEffect(() => {
    const eventSource = connectToStream();

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div>
      <h1>Events</h1>
      {messages.map((message, index) => (
        <div key={index}>{message}</div>
      ))}
    </div>
  );
};
