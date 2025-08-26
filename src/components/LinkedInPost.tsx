import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, MessageCircle, Repeat2, Send, MoreHorizontal } from "lucide-react";

interface LinkedInPostProps {
  author: {
    name: string;
    title: string;
    avatar: string;
    initials: string;
  };
  timestamp: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
}

export const LinkedInPost = ({
  author,
  timestamp,
  content,
  image,
  likes,
  comments,
  shares
}: LinkedInPostProps) => {
  return (
    <Card className="w-full max-w-2xl mx-auto bg-card border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-all duration-200">
      {/* Post Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback className="bg-linkedin-light-blue text-linkedin-blue font-semibold">
              {author.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-card-foreground text-sm leading-tight hover:text-linkedin-blue cursor-pointer transition-colors">
              {author.name}
            </h3>
            <p className="text-linkedin-gray text-xs leading-tight mt-0.5">
              {author.title}
            </p>
            <p className="text-linkedin-gray text-xs leading-tight mt-0.5 flex items-center gap-1">
              {timestamp} • 🌐
            </p>
          </div>
        </div>
        <Button variant="linkedin-ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-card-foreground text-sm leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>

      {/* Post Image */}
      {image && (
        <div className="mx-4 mb-3">
          <img 
            src={image} 
            alt="Post content" 
            className="w-full rounded-lg object-cover max-h-96"
          />
        </div>
      )}

      {/* Engagement Stats */}
      <div className="px-4 py-2 border-b border-border">
        <div className="flex items-center justify-between text-xs text-linkedin-gray">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              <div className="w-4 h-4 bg-linkedin-blue rounded-full flex items-center justify-center">
                <ThumbsUp className="w-2.5 h-2.5 text-white fill-current" />
              </div>
            </div>
            <span className="ml-1">{likes.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{comments} comments</span>
            <span>{shares} shares</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-2">
        <div className="flex items-center justify-around">
          <Button variant="linkedin-ghost" className="flex-1 gap-2 h-10 text-linkedin-gray hover:bg-linkedin-light-gray">
            <ThumbsUp className="h-4 w-4" />
            Like
          </Button>
          <Button variant="linkedin-ghost" className="flex-1 gap-2 h-10 text-linkedin-gray hover:bg-linkedin-light-gray">
            <MessageCircle className="h-4 w-4" />
            Comment
          </Button>
          <Button variant="linkedin-ghost" className="flex-1 gap-2 h-10 text-linkedin-gray hover:bg-linkedin-light-gray">
            <Repeat2 className="h-4 w-4" />
            Repost
          </Button>
          <Button variant="linkedin-ghost" className="flex-1 gap-2 h-10 text-linkedin-gray hover:bg-linkedin-light-gray">
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
};