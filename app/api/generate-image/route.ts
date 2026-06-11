import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    console.log("[v0] Generating image with prompt:", prompt)

    const result = await generateText({
      model: "google/gemini-2.5-flash-image",
      prompt,
      experimental_providerOptions: {
        google: {
          imageGenerationConfig: {
            aspectRatio: "16:9",
          },
        },
      },
    })

    console.log("[v0] Generation result:", result)

    const images = []
    if (result.files) {
      for (const file of result.files) {
        if (file.mediaType.startsWith("image/")) {
          images.push({
            base64: file.base64,
            mediaType: file.mediaType,
          })
        }
      }
    }

    console.log("[v0] Images extracted:", images.length)

    return Response.json({
      text: result.text,
      images,
      usage: result.usage,
      finishReason: result.finishReason,
    })
  } catch (error) {
    console.error("[v0] Error generating image:", error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate image",
        details: error,
      },
      { status: 500 },
    )
  }
}
