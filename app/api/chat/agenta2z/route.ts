import { CHAT_SETTING_LIMITS } from "@/lib/chat-setting-limits"
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { getBase64FromDataURL, getMediaTypeFromDataURL } from "@/lib/utils"
import { ChatSettings } from "@/types"
import Anthropic from "@anthropic-ai/sdk"
import { AnthropicStream } from "@/lib/ai/anthropic-stream"
import { StreamingTextResponse } from "@/lib/ai/streaming-text-response"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: NextRequest) {
  const json = await request.json()
  console.log("request:", json)
  const { chatSettings, messages, taskId } = json as {
    chatSettings: ChatSettings
    messages: any[]
    taskId: string
  }

  try {
    const profile = await getServerProfile()
    // console.log("profile:", profile)
    // checkApiKey(profile.anthropic_api_key, "Anthropic")

    let ANTHROPIC_FORMATTED_MESSAGES: any = messages.slice(1)

    ANTHROPIC_FORMATTED_MESSAGES = ANTHROPIC_FORMATTED_MESSAGES?.map(
      (message: any) => {
        const messageContent =
          typeof message?.content === "string"
            ? [message.content]
            : message?.content

        return {
          ...message,
          content: messageContent.map((content: any) => {
            if (typeof content === "string") {
              // Handle the case where content is a string
              return { type: "text", text: content }
            } else if (
              content?.type === "image_url" &&
              content?.image_url?.url?.length
            ) {
              return {
                type: "image",
                source: {
                  type: "base64",
                  media_type: getMediaTypeFromDataURL(content.image_url.url),
                  data: getBase64FromDataURL(content.image_url.url)
                }
              }
            } else {
              return content
            }
          })
        }
      }
    )

    console.log("messages:", ANTHROPIC_FORMATTED_MESSAGES)

    // const anthropic = new Anthropic({
    //   baseURL: "http://127.0.0.1:5000",
    //   apiKey: profile.anthropic_api_key || ""
    // })

    try {
      // const response = await anthropic.messages.create({
      //   model: chatSettings.model,
      //   messages: ANTHROPIC_FORMATTED_MESSAGES,
      //   temperature: chatSettings.temperature,
      //   system: messages[0].content,
      //   max_tokens:
      //     CHAT_SETTING_LIMITS[chatSettings.model].MAX_TOKEN_OUTPUT_LENGTH,
      //   stream: true
      // })

      const response = await fetch("http://127.0.0.1:5000/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: ANTHROPIC_FORMATTED_MESSAGES,
          task_id: taskId
        })
      })

      try {
        const data = await response.json()
        data.content.filter
        console.log(data)
        return new NextResponse(JSON.stringify({ message: data }))
      } catch (error: any) {
        console.error("Error parsing Anthropic API response:", error)
        return new NextResponse(
          JSON.stringify({
            message:
              "An error occurred while parsing the Anthropic API response"
          }),
          { status: 500 }
        )
      }
    } catch (error: any) {
      console.error("Error calling Anthropic API:", error)
      return new NextResponse(
        JSON.stringify({
          message: "An error occurred while calling the Anthropic API"
        }),
        { status: 500 }
      )
    }
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "Anthropic API Key not found. Please set it in your profile settings."
    } else if (errorCode === 401) {
      errorMessage =
        "Anthropic API Key is incorrect. Please fix it in your profile settings."
    }

    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
