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
    <div className="relative overflow-hidden">
      <Carousel
        opts={{
          align: "center",
          loop: false,
        }}
        className="w-full"
        setApi={setApi}
      >
        {/* <CarouselPrevious />
        <CarouselNext /> */}
        <div className="relative">
        <div className="hidden md:block absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="hidden md:block absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          <CarouselContent className="-ml-2 md:-ml-4">
            {comments.map((comment, index) => (
              <CarouselItem
                key={index}
                className={`pl-2 md:pl-6 basis-full ${
                  selectedCommentIndex === index
                    ? "md:basis-4/5 lg:basis-4/5 transition-all duration-300"
                    : "md:basis-4/5 lg:basis-4/5"
                }`}
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
        </div>
        
      </Carousel>
    </div>
  );
} 