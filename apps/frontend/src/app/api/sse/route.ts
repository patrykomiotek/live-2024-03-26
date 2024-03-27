// File: app/api/stream/route.js

import Redis from 'ioredis';

// Prevents this route's response from being cached on Vercel
export const dynamic = 'force-dynamic';

console.log({ dsn: process.env.UPSTASH_REDIS_URL });
const redisSubscriber = new Redis(process.env.UPSTASH_REDIS_URL!);

export async function GET() {
  const encoder = new TextEncoder();
  // Create a streaming response

  const customReadable = new ReadableStream({
    start(controller) {
      const message = {
        type: 'init',
        payload: { message: 'Hey, I am a message.' },
      };
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
      );

      const setKey = 'mewa-2024-03-26';

      // Subscribe to Redis updates for the key: "posts"
      // In case of any error, just log it
      redisSubscriber.subscribe(setKey, (err) => {
        if (err) console.log(err);
      });

      // Listen for new posts from Redis
      redisSubscriber.on('message', (channel, message) => {
        // Log the data when the channel message is received is same as the message is published to
        console.log(channel, message);

        if (channel === setKey) {
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
