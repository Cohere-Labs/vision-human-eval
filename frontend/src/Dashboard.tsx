import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface VoteResult {
  id: number;
  prompt_id: string;
  timestamp: string;
  language: string;
  prompt: string;
  generation_a: string;
  generation_b: string;
  vote: string;
}

const Dashboard: React.FC = () => {
  const [results, setResults] = useState<VoteResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [flushStatus, setFlushStatus] = useState<string>('');

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/results');
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const flushDatabase = async () => {
    if (window.confirm('Are you sure you want to flush the database? This action cannot be undone.')) {
      try {
        setFlushStatus('Flushing database...');
        const response = await fetch('/api/flush-database', {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setFlushStatus('Database flushed successfully!');
          fetchResults(); // Refresh the results after flushing
        } else {
          const errorData = await response.json();
          setFlushStatus(`Error: ${errorData.detail || 'Failed to flush database'}`);
        }
      } catch (error) {
        console.error('Error flushing database:', error);
        setFlushStatus('Error: Failed to flush database');
      }
      
      // Clear status message after 3 seconds
      setTimeout(() => {
        setFlushStatus('');
      }, 3000);
    }
  };

  // Handle keyboard shortcut for database flush (Ctrl+Alt+F)
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey && event.altKey && event.key === 'f') {
      flushDatabase();
    }
  }, []);

  useEffect(() => {
    // Add event listener for keyboard shortcut
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 5000); // refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Markdown component with styling
  const MarkdownCell = ({ content }: { content: string }) => (
    <div className="p-2 text-left max-h-60 overflow-y-auto prose prose-sm max-w-none">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-center">Vote Results Dashboard</h1>
        {flushStatus && (
          <div className="mt-2 text-center text-sm font-medium">
            {flushStatus}
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">ID</th>
                <th className="py-2 px-4 border-b">Prompt ID</th>
                <th className="py-2 px-4 border-b">Timestamp</th>
                <th className="py-2 px-4 border-b">Language</th>
                <th className="py-2 px-4 border-b">Prompt</th>
                <th className="py-2 px-4 border-b">Generation A</th>
                <th className="py-2 px-4 border-b">Generation B</th>
                <th className="py-2 px-4 border-b">Vote</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id}>
                  <td className="py-2 px-4 border-b text-center">{result.id}</td>
                  <td className="py-2 px-4 border-b text-center">{result.prompt_id}</td>
                  <td className="py-2 px-4 border-b text-center">{result.timestamp}</td>
                  <td className="py-2 px-4 border-b text-center">{result.language}</td>
                  <td className="py-2 px-4 border-b">
                    <MarkdownCell content={result.prompt} />
                  </td>
                  <td className="py-2 px-4 border-b">
                    <MarkdownCell content={result.generation_a} />
                  </td>
                  <td className="py-2 px-4 border-b">
                    <MarkdownCell content={result.generation_b} />
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    <span className={`px-2 py-1 rounded ${
                      result.vote === 'A' ? 'bg-blue-100 text-blue-800' : 
                      result.vote === 'B' ? 'bg-green-100 text-green-800' : 
                      result.vote === 'tie' ? 'bg-yellow-100 text-yellow-800' : 
                      result.vote === 'both_bad' ? 'bg-red-100 text-red-800' : ''
                    }`}>
                      {result.vote}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 