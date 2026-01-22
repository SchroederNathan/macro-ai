import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "google/gemini-3-flash",
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),

  });

  return result.toUIMessageStreamResponse({
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'none',
    },
  });
}