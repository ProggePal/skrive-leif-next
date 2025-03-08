import { Quote } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";

type Comment = {
  os?: string | undefined;
  is?: string | undefined;
  rsn?: string | undefined;
};

interface CommentCarouselProps {
  comments: Comment[];
  selectedCommentIndex: number | null;
  commentStates: Record<number, boolean>;
  onCommentSelect: (index: number) => void;
  onCommentToggle: (index: number) => void;
  isCommentComplete: (comment: Comment) => boolean;
}

export function CommentCarousel({
  comments,
  selectedCommentIndex,
  commentStates,
  onCommentSelect,
  onCommentToggle,
  isCommentComplete,
}: CommentCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;
    
    // Update carousel when selectedCommentIndex changes
    if (selectedCommentIndex !== null) {
      api.scrollTo(selectedCommentIndex);
    }
  }, [api, selectedCommentIndex]);

  return (
    <Carousel
      opts={{
        align: "center",
        loop: false,
      }}
      className="w-full"
      setApi={setApi}
    >
      <CarouselContent className="-ml-2 md:-ml-4">
        {comments.map((comment, index) => (
          <CarouselItem
            key={index}
            className={`pl-2 md:pl-4 basis-full ${
                selectedCommentIndex === index
                  ? "md:basis-4/5 lg:basis-4/5 transition-all duration-300"
                  : "md:basis-4/5 lg:basis-4/5"
              }`}
            // className="pl-2 md:pl-4 basis-full  md:basis-1/3 lg:basis-1/3"
          >
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-all h-full ${
                selectedCommentIndex === index
                  ? "border-primary bg-primary/5 "
                  : "border-border hover:bg-muted/50 scale-97"
              }`}
              onClick={() => {
                if (isCommentComplete(comment)) {
                  onCommentSelect(index);
                }
              }}
            >
              <p className="font-medium italic inline-flex items-center gap-2">
                <Quote className="w-4 h-4" />
                {comment?.rsn}
              </p>
              <p className="mt-2"><span className="font-bold">Suggestion:</span> {comment?.is}</p>
              <p className="mt-2"><span className="font-bold">Original:</span> {comment?.os}</p>

              <div className="flex justify-between items-center mt-2">
                <div></div>
                <span className="text-sm text-muted-foreground italic">
                  <Toggle
                    pressed={commentStates[index]}
                    onPressedChange={() => {
                      if (
                        comment &&
                        isCommentComplete(comment) &&
                        comment.os &&
                        comment.is
                      ) {
                        onCommentToggle(index);
                      }
                    }}
                  >
                    {isCommentComplete(comment)
                      ? commentStates[index]
                        ? "Using Improved Version"
                        : "Using Original Version"
                      : "Loading..."}
                  </Toggle>
                </span>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
} 