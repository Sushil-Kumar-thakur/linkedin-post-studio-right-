import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { linkedinCompanyUrl, linkedinPersonalUrl, companyName } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Starting brand analysis for:', companyName);
    
    // Simulate LinkedIn scraping (in production, this would use actual scraping)
    const linkedinData = await mockLinkedInScraping({
      companyUrl: linkedinCompanyUrl,
      personalUrl: linkedinPersonalUrl
    });

    // Analyze with AI
    const analysisPrompt = `Analyze the following LinkedIn data and extract brand voice, tone, and content strategy insights:

Company: ${companyName}
${linkedinData.companyPosts ? `Company Posts: ${JSON.stringify(linkedinData.companyPosts)}` : ''}
${linkedinData.personalPosts ? `Personal Posts: ${JSON.stringify(linkedinData.personalPosts)}` : ''}
${linkedinData.companyInfo ? `Company Info: ${JSON.stringify(linkedinData.companyInfo)}` : ''}

Provide a JSON response with:
{
  "voiceTone": "description of brand voice and tone",
  "contentTopics": ["array", "of", "common", "topics"],
  "postingStyle": "description of posting style and frequency",
  "targetAudience": "description of target audience",
  "industryInsights": "relevant industry context",
  "recommendations": ["array", "of", "content", "recommendations"]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a brand analysis expert. Analyze LinkedIn data to extract brand voice and content strategy insights.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisContent = data.choices[0].message.content;

    let analysis;
    try {
      analysis = JSON.parse(analysisContent);
    } catch (parseError) {
      console.error('Failed to parse AI analysis:', parseError);
      analysis = {
        voiceTone: 'Professional and informative',
        contentTopics: ['Industry insights', 'Company updates', 'Thought leadership'],
        postingStyle: 'Regular, professional updates',
        targetAudience: 'Industry professionals',
        industryInsights: 'Standard industry practices',
        recommendations: ['Share industry insights', 'Post company updates', 'Engage with community']
      };
    }

    return new Response(JSON.stringify({
      success: true,
      analysis,
      scrapedData: linkedinData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-brand function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to analyze brand',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function mockLinkedInScraping({ companyUrl, personalUrl }) {
  // In production, this would use actual LinkedIn scraping or APIs
  // For now, we'll return mock data
  
  const mockData = {
    companyInfo: companyUrl ? {
      description: 'Innovative technology company focused on digital transformation',
      industry: 'Technology',
      followers: '10K+',
      website: 'company.com'
    } : null,
    
    companyPosts: companyUrl ? [
      {
        content: 'Excited to announce our latest product launch! Our team has been working hard to bring you innovative solutions.',
        engagement: { likes: 120, comments: 15, shares: 8 },
        date: '2024-01-15'
      },
      {
        content: 'Thought leadership: The future of digital transformation in 2024. Here are our top predictions.',
        engagement: { likes: 85, comments: 22, shares: 12 },
        date: '2024-01-10'
      }
    ] : [],
    
    personalPosts: personalUrl ? [
      {
        content: 'Reflecting on the importance of innovation in today\'s business landscape. Key insights from recent industry events.',
        engagement: { likes: 45, comments: 8, shares: 3 },
        date: '2024-01-12'
      },
      {
        content: 'Grateful for the amazing team I work with. Collaboration is key to success in any organization.',
        engagement: { likes: 67, comments: 12, shares: 2 },
        date: '2024-01-08'
      }
    ] : []
  };

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return mockData;
}