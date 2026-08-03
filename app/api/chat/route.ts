import { createAgentUIStreamResponse, type UIMessage } from "ai";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createShoppingAgent } from "@/lib/ai/shopping-agent";
import { rateLimitHeaders, takeRateLimit } from "@/lib/security/rate-limit";

const MAX_CHAT_BYTES = 64 * 1024;
const chatRequestSchema = z
  .object({
    messages: z
      .array(
        z
          .object({
            id: z.string().max(200),
            role: z.enum(["system", "user", "assistant"]),
            parts: z.array(z.unknown()).max(50),
          })
          .passthrough(),
      )
      .min(1)
      .max(50),
  })
  .strict();

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = takeRateLimit({
    key: `chat:${userId}`,
    limit: 20,
    windowMs: 5 * 60 * 1_000,
  });
  const responseHeaders = rateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Too many chat requests. Please try again shortly." },
      { status: 429, headers: responseHeaders },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_CHAT_BYTES) {
    return Response.json(
      { error: "Chat request is too large" },
      { status: 413, headers: responseHeaders },
    );
  }

  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > MAX_CHAT_BYTES) {
    return Response.json(
      { error: "Chat request is too large" },
      { status: 413, headers: responseHeaders },
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: responseHeaders },
    );
  }

  const parsed = chatRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid chat request" },
      { status: 400, headers: responseHeaders },
    );
  }

  const agent = createShoppingAgent({ userId });
  const response = await createAgentUIStreamResponse({
    agent,
    uiMessages: parsed.data.messages as UIMessage[],
  });

  for (const [name, value] of Object.entries(responseHeaders)) {
    response.headers.set(name, value);
  }
  return response;
}
