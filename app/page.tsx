'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';
import { commentSchema } from './api/use-object/schema';
import { useState } from 'react';

export default function Page() {
  const { object, submit } = useObject({
    api: '/api/use-object',
    schema: commentSchema,
  });

  const [inputValue, setInputValue] = useState('');
  const [submittedValue, setSubmittedValue] = useState('');

  const handleSubmit = () => {
    setSubmittedValue(inputValue);
    submit(inputValue);
  };

  return (
    <div className="centered-container">
      <div className="centered-content">
        {submittedValue ? (
          <p>{submittedValue}</p>
        ) : (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter your message here"
          />
        )}
        <button onClick={handleSubmit}>
          Generate notifications
        </button>

      <style jsx>{`
        .comment-box {
          border: 1px solid #ccc;
          padding: 10px;
          margin-bottom: 10px;
          border-radius: 5px;
        }
        .sender {
          font-weight: bold;
          font-family: 'Courier New', Courier, monospace;
        }
      `}</style>

        {object?.comments?.map((comment, index) => (
          <div key={index} className="comment-box">
            <p className="sender">Original: {comment?.os}</p>
            <p>Improved: {comment?.is}</p>
            <p>Reason: {comment?.rsn}</p>
          </div>
        ))}
      </div>
    </div>
  );
}