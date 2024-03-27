// File: app/api/stream/route.js

import Redis from 'ioredis';

// Prevents this route's response from being cached on Vercel
export const dynamic = 'force-dynamic';

const redisSubscriber = new Redis(process.env.REDIS_DSN!);

export async function GET() {
  const encoder = new TextEncoder();
  // Create a streaming response

  const customReadable = new ReadableStream({
    start(controller) {
      const message = {
        type: 'init',
        payload: { content: 'Hey, I am a message.' },
      };
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
      );

      const channel = 'session-123';

      // Subscribe to Redis updates for the key: "posts"
      // In case of any error, just log it
      redisSubscriber.subscribe(channel, (err) => {
        if (err) console.log(err);
      });

      // Listen for new posts from Redis
      redisSubscriber.on('message', (channel, message) => {
        // Log the data when the channel message is received is same as the message is published to
        console.log(channel, message);

        if (channel === channel) {
          console.log(message);
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
        }
      });

      redisSubscriber.on('end', () => {
        controller.close();
      });
    },
  });
  // Return the stream response and keep the connection alive
  return new Response(customReadable, {
    // Set the headers for Server-Sent Events (SSE)
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
      'Content-Encoding': 'none',
    },
  });
}
