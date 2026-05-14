import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic();

export async function GET() {
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content:
            "In one sentence, confirm you are working. Then describe what a creative ops orchestration system does in two sentences.",
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({
      success: true,
      model: message.model,
      response: responseText,
      usage: message.usage,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}