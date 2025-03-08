'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';
import { commentSchema } from './api/use-object/schema';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Toggle } from "@/components/ui/toggle"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

export default function Page() {
  const { object, submit } = useObject({
    api: '/api/use-object',
    schema: commentSchema,
  });

  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [selectedCommentIndex, setSelectedCommentIndex] = useState<number | null>(null);
  const [commentStates, setCommentStates] = useState<Record<number, boolean>>({});
  const [lastEscTime, setLastEscTime] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize comment states when we get new comments
  useEffect(() => {
    const comments = object?.comments;
    if (comments?.length) {
      setCommentStates(prev => {
        const newStates = { ...prev };
        comments.forEach((_, index) => {
          // Only initialize state for new comments
          if (!(index in newStates)) {
            newStates[index] = false;
          }
        });
        return newStates;
      });
    }
  }, [object?.comments]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.textContent = inputValue;
    }
  }, [inputValue]);

  const handleSubmit = () => {
    if (contentRef.current) {
      const text = contentRef.current.textContent || '';
      setInputValue(text);
      submit(text);
      setIsEditing(false);
    }
  };

  const updateContentWithSwap = (originalText: string, improvedText: string, commentIndex: number) => {
    if (!contentRef.current) return;

    const content = contentRef.current.textContent || '';
    const isUsingImproved = commentStates[commentIndex];

    // If we're using improved text, swap back to original
    if (isUsingImproved) {
      const updatedContent = content.replace(improvedText, originalText);
      contentRef.current.textContent = updatedContent;
      setInputValue(updatedContent);
    } else {
      // If we're using original text, swap to improved
      const updatedContent = content.replace(originalText, improvedText);
      contentRef.current.textContent = updatedContent;
      setInputValue(updatedContent);
    }

    // Update the state for this specific comment
    setCommentStates(prev => ({
      ...prev,
      [commentIndex]: !prev[commentIndex]
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setIsEditing(true);
    setSelectedCommentIndex(null);
    // Reset all comment states to original version
    const newStates: Record<number, boolean> = {};
    if (object?.comments) {
      object.comments.forEach((_, index) => {
        newStates[index] = false;
      });
    }
    setCommentStates(newStates);
  };

  const isCommentComplete = useCallback((comment: any) => {
    return comment?.os && comment?.is && comment?.rsn;
  }, []);

  const handleCommentNavigation = useCallback((e: KeyboardEvent) => {
    const comments = object?.comments;
    if (e.key === 'Escape' && !isEditing) {
      const now = Date.now();
      if (now - lastEscTime < 500) { // 500ms window for double-press
        handleBack();
      }
      setLastEscTime(now);
      return;
    }

    if (!comments?.length) return;

    if (e.key === 'ArrowLeft') {
      setSelectedCommentIndex(prev =>
        prev === null ? comments.length - 1 :
          prev === 0 ? comments.length - 1 :
            prev - 1
      );
    } else if (e.key === 'ArrowRight') {
      setSelectedCommentIndex(prev =>
        prev === null ? 0 :
          prev === comments.length - 1 ? 0 :
            prev + 1
      );
    } else if (e.key === 'Enter') {
      if (selectedCommentIndex !== null) {
        const comment = comments[selectedCommentIndex];
        if (comment && isCommentComplete(comment) && comment.os && comment.is) {
          updateContentWithSwap(comment.os, comment.is, selectedCommentIndex);
        }
      }
      if (selectedCommentIndex === null) {
        setSelectedCommentIndex(0);
      } else if (selectedCommentIndex < comments.length - 1) {
        setSelectedCommentIndex(prev => prev! + 1);
      }
    } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (selectedCommentIndex !== null) {
        const comment = comments[selectedCommentIndex];
        if (comment && isCommentComplete(comment) && comment.os && comment.is) {
          updateContentWithSwap(comment.os, comment.is, selectedCommentIndex);
        }
      }
    }
  }, [object?.comments, selectedCommentIndex, commentStates, isCommentComplete, lastEscTime]);

  useEffect(() => {
    if (!isEditing && object?.comments?.length) {
      window.addEventListener('keydown', handleCommentNavigation);
      return () => window.removeEventListener('keydown', handleCommentNavigation);
    }
  }, [isEditing, object?.comments, handleCommentNavigation, lastEscTime]);

  const highlightText = useCallback((text: string) => {
    if (!contentRef.current) return;

    const content = contentRef.current.textContent || '';
    const index = content.indexOf(text);
    if (index === -1) return;

    const range = document.createRange();
    range.setStart(contentRef.current.firstChild || contentRef.current, index);
    range.setEnd(contentRef.current.firstChild || contentRef.current, index + text.length);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  useEffect(() => {
    if (selectedCommentIndex !== null && object?.comments?.[selectedCommentIndex]) {
      const comment = object.comments[selectedCommentIndex];
      if (isCommentComplete(comment)) {
        const isUsingImproved = commentStates[selectedCommentIndex];
        const textToHighlight = isUsingImproved ? comment.is : comment.os;
        if (textToHighlight) {
          highlightText(textToHighlight);
        }
      }
    }
  }, [selectedCommentIndex, object?.comments, commentStates, highlightText, isCommentComplete]);

  return (
    <div className="flex justify-center items-start min-h-screen p-8">
      <div className="w-full max-w-3xl flex flex-col gap-4">
        <div className="relative">
          <div
            ref={contentRef}
            className="w-full min-h-[200px] p-4 text-base leading-relaxed border rounded-lg outline-none whitespace-pre-wrap break-words bg-background"
            contentEditable={isEditing}
            onKeyDown={handleKeyDown}
            data-placeholder="Enter your text here..."
          />
          <div className="text-sm text-muted-foreground mt-2 pl-4">
            {isEditing ? (
              <span>When you're done, press ⌘ + Enter to analyze your text</span>
            ) : (
              <span>Use ← → to navigate, Space to swap text, double-Esc to edit</span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            {!isEditing && (
              <Button
                variant="outline"
                onClick={handleBack}
              >
                Edit
              </Button>
            )}
          </div>
          <div>
            {isEditing ? (
              <Button
                onClick={handleSubmit}
                disabled={!isEditing}
              >
                Analyze
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const comments = object?.comments;
                    if (comments?.length) {
                      setSelectedCommentIndex(prev =>
                        prev === null ? comments.length - 1 :
                          prev === 0 ? comments.length - 1 :
                            prev - 1
                      );
                    }
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const comments = object?.comments;
                    if (comments?.length) {
                      setSelectedCommentIndex(prev =>
                        prev === null ? 0 :
                          prev === comments.length - 1 ? 0 :
                            prev + 1
                      );
                    }
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {object?.comments?.map((comment, index) => (
          <div
            key={index}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedCommentIndex === index
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted/50'
              }`}
            onClick={() => {
              if (isCommentComplete(comment)) {
                setSelectedCommentIndex(index);
              }
            }}
          >
            <p className='font-medium italic inline-flex items-center gap-2'><Quote className='w-4 h-4' />{comment?.rsn}</p>
            <p>Improved: {comment?.is}</p>
            <p>Original: {comment?.os}</p>


            <div className="flex justify-between items-center mt-2">
              <div>

              </div>

              <span className="text-sm text-muted-foreground italic">
                <Toggle
                  pressed={commentStates[index]}
                  onPressedChange={(pressed: boolean) => {
                    if (comment && isCommentComplete(comment) && comment.os && comment.is) {
                      updateContentWithSwap(comment.os, comment.is, index);
                    }
                  }}
                >

                  {isCommentComplete(comment) ? (
                    commentStates[index] ? 'Using Improved Version' : 'Using Original Version'
                  ) : 'Loading...'}
                </Toggle>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}