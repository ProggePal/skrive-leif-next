'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';
import { commentSchema } from './api/use-object/schema';
import { useState, useRef, useEffect, useCallback } from 'react';

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
    <div className="centered-container">
      <div className="centered-content">
        <div className="text-field-container">
          <div
            ref={contentRef}
            className="editable-field"
            contentEditable={isEditing}
            onKeyDown={handleKeyDown}
            data-placeholder="Enter your text here..."
          />
          <div className="help-text">
            {isEditing ? (
              <span>When you're done, press ⌘ + Enter to analyze your text</span>
            ) : (
              <span>Use ← → to navigate, Space to swap text, double-Esc to edit</span>
            )}
          </div>
        </div>
        <div className="controls-container">
          <div className="left-controls">
            {!isEditing && (
              <button className="control-button" onClick={handleBack}>
                Edit
              </button>
            )}
          </div>
          <div className="right-controls">
            {isEditing ? (
              <button 
                className="control-button analyze-button"
                onClick={handleSubmit}
                disabled={!isEditing}
              >
                Analyze
              </button>
            ) : (
              <div className="navigation-controls">
                <button 
                  className="control-button"
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
                  ←
                </button>
                <button 
                  className="control-button"
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
                  →
                </button>
              </div>
            )}
          </div>
        </div>

        {object?.comments?.map((comment, index) => (
          <div 
            key={index} 
            className={`comment-box ${selectedCommentIndex === index ? 'selected' : ''}`}
            onClick={() => {
              if (isCommentComplete(comment)) {
                setSelectedCommentIndex(index);
              }
            }}
          >
            <p className="sender">Original: {comment?.os}</p>
            <p>Improved: {comment?.is}</p>
            <p>Reason: {comment?.rsn}</p>
            <div className="comment-controls">
              <button 
                className="swap-button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (comment && isCommentComplete(comment) && comment.os && comment.is) {
                    updateContentWithSwap(comment.os, comment.is, index);
                  }
                }}
              >
                {commentStates[index] ? 'Use Original' : 'Use Improved'}
              </button>
              <span className="version-indicator">
                {isCommentComplete(comment) ? (
                  commentStates[index] ? 'Using Improved Version' : 'Using Original Version'
                ) : 'Loading...'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .centered-container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: 100vh;
          padding: 2rem;
        }

        .centered-content {
          width: 100%;
          max-width: 800px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .text-field-container {
          width: 100%;
          margin-bottom: 1rem;
          position: relative;
        }

        .editable-field {
          width: 100%;
          min-height: 200px;
          padding: 1rem;
          font-size: 16px;
          line-height: 1.5;
          border: 1px solid #ccc;
          border-radius: 8px;
          outline: none;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .editable-field:empty:before {
          content: attr(data-placeholder);
          color: #999;
        }

        .editable-field:not([contentEditable="true"]) {
          background-color: #f9f9f9;
        }

        .help-text {
          font-size: 0.9rem;
          color: #666;
          margin-top: 0.5rem;
          text-align: left;
          padding-left: 1rem;
        }

        .controls-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 1rem 0;
        }

        .left-controls, .right-controls {
          display: flex;
          gap: 0.5rem;
        }

        .control-button {
          padding: 0.5rem 1rem;
          background-color: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .control-button:hover {
          background-color: #e0e0e0;
        }

        .control-button.analyze-button {
          background-color: #0070f3;
          color: white;
          border: none;
        }

        .control-button.analyze-button:hover {
          background-color: #0051b3;
        }

        .control-button.analyze-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .navigation-controls {
          display: flex;
          gap: 0.5rem;
        }

        .comment-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.5rem;
        }

        .swap-button {
          padding: 0.25rem 0.5rem;
          background-color: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .swap-button:hover {
          background-color: #e0e0e0;
        }

        .version-indicator {
          font-size: 0.9em;
          color: #666;
          font-style: italic;
        }

        .comment-box {
          border: 1px solid #ccc;
          padding: 1rem;
          margin-top: 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .comment-box:hover {
          background-color: #f5f5f5;
        }

        .comment-box.selected {
          border-color: #0070f3;
          background-color: #f0f7ff;
        }

        .sender {
          font-weight: bold;
          font-family: 'Courier New', Courier, monospace;
        }
      `}</style>
    </div>
  );
}