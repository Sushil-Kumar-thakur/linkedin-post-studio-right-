import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      platforms,
      topic,
      keywords,
      tone,
      length,
      includeHashtags,
      includeEmojis,
      customInstructions,
      companyProfile,
    } = await req.json();

    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const generatedPosts = [];

    for (const platform of platforms) {
      const prompt = buildPrompt({
        platform,
        topic,
        keywords,
        tone,
        length,
        includeHashtags,
        includeEmojis,
        customInstructions,
        companyProfile,
      });

      console.log(`Generating content for ${platform}...`);

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAIApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are an expert social media content creator. Generate engaging, platform-specific content that converts. Always respond with a JSON object containing "content", "hashtags" (array), and "imagePrompt" (string).`,
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.8,
            max_tokens: 1000,
          }),
        }
      );

      if (!response.ok) {
        console.error(
          `OpenAI API error for ${platform}:`,
          await response.text()
        );
        continue;
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      try {
        const parsed = JSON.parse(content);
        generatedPosts.push({
          platform,
          content: parsed.content,
          hashtags: parsed.hashtags || [],
          imagePrompt:
            parsed.imagePrompt || `Professional ${topic} image for ${platform}`,
        });
      } catch (parseError) {
        console.error(`Failed to parse JSON for ${platform}:`, parseError);
        // Fallback to plain text content
        generatedPosts.push({
          platform,
          content: content,
          hashtags: generateFallbackHashtags(keywords, platform),
          imagePrompt: `Professional ${topic} image for ${platform}`,
        });
      }
    }

    return new Response(JSON.stringify({ posts: generatedPosts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-posts function:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate posts",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function buildPrompt({
  platform,
  topic,
  keywords,
  tone,
  length,
  includeHashtags,
  includeEmojis,
  customInstructions,
  companyProfile,
}) {
  const lengthGuide = {
    short: "1-2 sentences (max 50 words)",
    medium: "a paragraph (max 150 words)",
    long: "detailed content (max 300 words)",
  };

  const platformSpecs = {
    linkedin: "Professional, industry-focused, thought leadership",
    facebook: "Community-focused, conversational, engaging",
    twitter: "Concise, trending, hashtag-heavy",
    instagram: "Visual-first, lifestyle, inspirational",
    tiktok: "Trendy, entertainment-focused, Gen Z language",
    youtube: "Educational, tutorial-style, call-to-action focused",
  };

  let prompt = `Create a ${tone} ${platform} post about "${topic}" that is ${
    lengthGuide[length]
  }.

Platform guidelines: ${platformSpecs[platform]}

${keywords ? `Keywords to include: ${keywords}` : ""}
${includeHashtags ? "Include relevant hashtags." : "Do not include hashtags."}
${includeEmojis ? "Use appropriate emojis." : "Do not use emojis."}
${customInstructions ? `Additional instructions: ${customInstructions}` : ""}

${
  companyProfile
    ? `Company context:
- Company: ${companyProfile.company_name}
- Industry: ${companyProfile.industry || "Not specified"}
- Voice/Tone: ${companyProfile.voice_tone || "Professional"}
- Brand Guidelines: ${
        companyProfile.brand_guidelines || "Standard professional guidelines"
      }`
    : ""
}

Respond with a JSON object containing:
{
  "content": "the post content",
  "hashtags": ["array", "of", "hashtags"],
  "imagePrompt": "description for an image that would accompany this post"
}`;

  return prompt;
}

function generateFallbackHashtags(keywords, platform) {
  const baseHashtags = keywords
    ? keywords.split(",").map((k) => `#${k.trim().replace(/\s+/g, "")}`)
    : [];

  const platformHashtags = {
    linkedin: ["#LinkedIn", "#Professional", "#Business"],
    facebook: ["#Facebook", "#Community"],
    twitter: ["#Twitter", "#Trending"],
    instagram: ["#Instagram", "#Content"],
    tiktok: ["#TikTok", "#Viral"],
    youtube: ["#YouTube", "#Video"],
  };

  return [...baseHashtags, ...(platformHashtags[platform] || [])].slice(0, 5);
}
