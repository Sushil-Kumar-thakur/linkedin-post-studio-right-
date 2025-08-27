import { useState, useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Wand2,
  Loader2,
  Image,
  Calendar,
  Copy,
  RefreshCw,
  Download,
  Edit,
  Send,
} from "lucide-react";

interface GenerationParams {
  platforms: string[];
  topic: string;
  keywords: string;
  tone: string;
  length: string;
  includeHashtags: boolean;
  includeEmojis: boolean;
  customInstructions: string;
}

interface GeneratedPost {
  platform: string;
  content: string;
  hashtags: string[];
  imagePrompt?: string;
}

export default function PostGenerator() {
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [formData, setFormData] = useState<GenerationParams>({
    platforms: ["linkedin"],
    topic: "",
    keywords: "",
    tone: "professional",
    length: "medium",
    includeHashtags: true,
    includeEmojis: false,
    customInstructions: "",
  });

  const platforms = [
    { id: "linkedin", name: "LinkedIn", icon: "💼" },
    { id: "facebook", name: "Facebook", icon: "📘" },
    { id: "twitter", name: "Twitter", icon: "🐦" },
    { id: "instagram", name: "Instagram", icon: "📸" },
    { id: "tiktok", name: "TikTok", icon: "🎵" },
    { id: "youtube", name: "YouTube", icon: "📺" },
  ];

  const tones = [
    "professional",
    "casual",
    "friendly",
    "authoritative",
    "inspirational",
    "humorous",
    "educational",
    "promotional",
  ];

  const lengths = [
    { value: "short", label: "Short (1-2 sentences)", max: "50 words" },
    { value: "medium", label: "Medium (paragraph)", max: "150 words" },
    { value: "long", label: "Long (detailed)", max: "300 words" },
  ];

  const handleInputChange = useCallback(
    (field: keyof GenerationParams, value: any) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handlePlatformToggle = useCallback((platformId: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter((p) => p !== platformId)
        : [...prev.platforms, platformId],
    }));
  }, []);

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      toast.error("Please enter a topic for your post");
      return;
    }

    if (formData.platforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    if (authLoading) {
      toast.error("Please wait while we load your profile...");
      return;
    }

    if (!profile?.user_id) {
      toast.error(
        "Unable to load your profile. Please refresh the page and try again."
      );
      return;
    }

    // Check generation limits
    if (
      profile.generations_used >= profile.generations_limit &&
      profile.subscription_tier === "free"
    ) {
      toast.error(
        "You have reached your monthly generation limit. Please upgrade your plan."
      );
      return;
    }

    setLoading(true);

    try {
      // Get company profile for brand context
      const { data: companyProfile } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", profile.user_id)
        .maybeSingle();

      // Call the n8n webhook via edge function
      const { data: webhookResult, error: functionError } =
        await supabase.functions.invoke("trigger-n8n-webhook", {
          body: {
            platforms: formData.platforms,
            topic: formData.topic,
            keywords: formData.keywords,
            tone: formData.tone,
            length: formData.length,
            includeHashtags: formData.includeHashtags,
            includeEmojis: formData.includeEmojis,
            customInstructions: formData.customInstructions,
            companyProfile: companyProfile,
          },
        });

      if (functionError) {
        console.error("N8N webhook error:", functionError);
        toast.error("Failed to trigger post generation workflow");
        return;
      }

      if (!webhookResult?.success) {
        console.error("N8N webhook failed:", webhookResult);
        toast.error(
          "Post generation workflow failed. Please check your N8N configuration."
        );
        return;
      }

      // For now, generate mock posts since the actual generation will happen in N8N
      // In a real implementation, N8N would call back to save the generated posts
      const mockPosts: GeneratedPost[] = formData.platforms.map((platform) => ({
        platform,
        content: generateMockContent(platform, formData),
        hashtags: generateMockHashtags(formData.keywords, platform),
        imagePrompt: `Create a ${formData.tone} image for ${platform} about ${formData.topic}`,
      }));

      setGeneratedPosts(mockPosts);

      // Save posts to database
      for (const post of mockPosts) {
        const { error } = await supabase.from("posts").insert({
          user_id: profile.user_id,
          title: formData.topic,
          content: post.content,
          platform: post.platform,
          status: "draft",
          ai_generated: true,
          generation_params: formData as any,
        });

        if (error) {
          console.error("Error saving post:", error);
        }
      }

      // Update generation count
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          generations_used: profile.generations_used + 1,
        })
        .eq("user_id", profile.user_id);

      if (updateError) {
        console.error("Error updating generation count:", updateError);
      }

      toast.success(
        `Post generation workflow triggered successfully! Generated ${mockPosts.length} posts.`
      );
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to trigger post generation workflow");
    } finally {
      setLoading(false);
    }
  };

  const generateMockContent = (
    platform: string,
    params: GenerationParams
  ): string => {
    const baseContent = `Exciting insights about ${params.topic}! `;

    switch (platform) {
      case "linkedin":
        return `${baseContent}In today's professional landscape, understanding ${
          params.topic
        } is crucial for business success. Here are key insights that can help drive growth and innovation in your organization. ${
          params.includeEmojis ? "💼 🚀" : ""
        }`;
      case "twitter":
        return `${baseContent}Quick thoughts on ${params.topic} ${
          params.includeEmojis ? "🧵" : ""
        }`;
      case "instagram":
        return `${baseContent}Sharing my thoughts on ${
          params.topic
        } - swipe for more insights! ${params.includeEmojis ? "✨ 📸" : ""}`;
      case "facebook":
        return `${baseContent}I wanted to share some thoughts about ${params.topic} with the community. What are your experiences?`;
      case "tiktok":
        return `POV: You're learning about ${params.topic} ${
          params.includeEmojis ? "🎵 ✨" : ""
        }`;
      case "youtube":
        return `Welcome back to the channel! Today we're diving deep into ${params.topic}. Don't forget to like and subscribe!`;
      default:
        return baseContent;
    }
  };

  const generateMockHashtags = (
    platform: string,
    keywords: string
  ): string[] => {
    const baseHashtags = keywords
      .split(",")
      .map((k) => `#${k.trim().replace(/\s+/g, "")}`);

    switch (platform) {
      case "linkedin":
        return [...baseHashtags, "#LinkedIn", "#Professional", "#Business"];
      case "twitter":
        return [...baseHashtags, "#Twitter", "#Thread"];
      case "instagram":
        return [...baseHashtags, "#Instagram", "#Content", "#Creative"];
      default:
        return baseHashtags;
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard!");
  };

  const handleEditPost = (index: number) => {
    // This would open an editor modal
    toast.info("Post editor coming soon!");
  };

  const handleSchedulePost = (post: GeneratedPost) => {
    // This would open scheduling interface
    toast.info("Post scheduling coming soon!");
  };

  if (authLoading) {
    return (
      <ProtectedRoute requireOnboarding>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireOnboarding>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1">
            {/* Header */}
            <header className="h-16 border-b border-border flex items-center px-6">
              <h1 className="text-2xl font-bold">Generate Posts</h1>
            </header>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Generation Form */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-primary" />
                        Content Generation
                      </CardTitle>
                      <CardDescription>
                        Configure your post parameters to generate engaging
                        content
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Platform Selection */}
                      <div className="space-y-3">
                        <Label>Select Platforms</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {platforms.map((platform) => (
                            <div
                              key={platform.id}
                              className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                                formData.platforms.includes(platform.id)
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:bg-muted/50"
                              }`}
                              onClick={() => handlePlatformToggle(platform.id)}
                            >
                              <Checkbox
                                checked={formData.platforms.includes(
                                  platform.id
                                )}
                                onChange={() =>
                                  handlePlatformToggle(platform.id)
                                }
                              />
                              <span className="text-lg">{platform.icon}</span>
                              <Label className="cursor-pointer">
                                {platform.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Topic */}
                      <div className="space-y-2">
                        <Label htmlFor="topic">Topic *</Label>
                        <Input
                          id="topic"
                          placeholder="What's your post about? (e.g., AI in marketing, team productivity)"
                          value={formData.topic}
                          onChange={(e) =>
                            handleInputChange("topic", e.target.value)
                          }
                        />
                      </div>

                      {/* Keywords */}
                      <div className="space-y-2">
                        <Label htmlFor="keywords">Keywords</Label>
                        <Input
                          id="keywords"
                          placeholder="Separate with commas (e.g., AI, automation, efficiency)"
                          value={formData.keywords}
                          onChange={(e) =>
                            handleInputChange("keywords", e.target.value)
                          }
                        />
                      </div>

                      {/* Tone and Length */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tone</Label>
                          <Select
                            value={formData.tone}
                            onValueChange={(value) =>
                              handleInputChange("tone", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {tones.map((tone) => (
                                <SelectItem
                                  key={tone}
                                  value={tone}
                                  className="capitalize"
                                >
                                  {tone}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Length</Label>
                          <Select
                            value={formData.length}
                            onValueChange={(value) =>
                              handleInputChange("length", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {lengths.map((length) => (
                                <SelectItem
                                  key={length.value}
                                  value={length.value}
                                >
                                  {length.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-3">
                        <Label>Options</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={formData.includeHashtags}
                              onCheckedChange={(checked) =>
                                handleInputChange("includeHashtags", checked)
                              }
                            />
                            <Label>Include hashtags</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={formData.includeEmojis}
                              onCheckedChange={(checked) =>
                                handleInputChange("includeEmojis", checked)
                              }
                            />
                            <Label>Include emojis</Label>
                          </div>
                        </div>
                      </div>

                      {/* Custom Instructions */}
                      <div className="space-y-2">
                        <Label htmlFor="customInstructions">
                          Custom Instructions
                        </Label>
                        <Textarea
                          id="customInstructions"
                          placeholder="Any specific requirements or style preferences..."
                          value={formData.customInstructions}
                          onChange={(e) =>
                            handleInputChange(
                              "customInstructions",
                              e.target.value
                            )
                          }
                          rows={3}
                          className="resize-none"
                        />
                      </div>

                      {/* Generation Button */}
                      <Button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full"
                        size="lg"
                      >
                        {loading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate Posts
                      </Button>

                      {/* Usage Info */}
                      {profile && (
                        <div className="text-center text-sm text-muted-foreground">
                          {profile.generations_used}/{profile.generations_limit}{" "}
                          generations used this month
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Generated Posts */}
                <div className="space-y-6">
                  {generatedPosts.length > 0 ? (
                    generatedPosts.map((post, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {
                                  platforms.find((p) => p.id === post.platform)
                                    ?.icon
                                }
                              </span>
                              <CardTitle className="capitalize">
                                {post.platform}
                              </CardTitle>
                            </div>
                            <Badge variant="outline">Generated</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Post Content */}
                          <div className="bg-muted/50 rounded-lg p-4">
                            <p className="whitespace-pre-wrap">
                              {post.content}
                            </p>
                          </div>

                          {/* Hashtags */}
                          {post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {post.hashtags.map((hashtag, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {hashtag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyContent(post.content)}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPost(index)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSchedulePost(post)}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Schedule
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Wand2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          No posts generated yet
                        </h3>
                        <p className="text-muted-foreground">
                          Configure your parameters and click "Generate Posts"
                          to create content
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
