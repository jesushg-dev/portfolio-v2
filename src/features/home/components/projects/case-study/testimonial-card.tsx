import { Quote } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  author: string;
  role?: string;
  avatarUrl?: string;
}

export function TestimonialCard({
  quote,
  author,
  role,
  avatarUrl,
}: TestimonialCardProps) {
  return (
    <div className="border-border bg-card relative rounded-2xl border p-8">
      <Quote className="text-primary/30 absolute top-6 right-6 h-8 w-8" />
      <blockquote className="text-foreground text-lg leading-relaxed italic">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <div className="mt-6 flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={author}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
            {author.charAt(0)}
          </div>
        )}
        <div>
          <p className="text-foreground font-medium">{author}</p>
          {role && (
            <p className="text-muted-foreground text-sm">{role}</p>
          )}
        </div>
      </div>
    </div>
  );
}
