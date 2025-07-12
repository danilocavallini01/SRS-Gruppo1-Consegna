import React, { useState } from 'react';
import { URI } from './secret';

interface PromptInputProps {
  onGeneratedCode: (code: string, folderId: number) => void;
}

export default function PromptInput({ onGeneratedCode }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${URI}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error('Error generating code, please try again.');
      }

      const data = await response.json();
      const answer = data.answer
      onGeneratedCode(answer.response, answer.folderId);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating code.');
      console.error('Error generating code:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mb-4">
      <textarea
        className="form-control"
        rows={3}
        placeholder="Deploy a web application with 2 backend APIs and a load balancer"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        className="btn btn-primary mt-2"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate'}
      </button>
      {error && <div className="text-danger mt-2">{error}</div>}
    </div>
  );
}