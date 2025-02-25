import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 5000); // refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Vote Results Dashboard</h1>
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
                <tr key={result.id} className="text-center">
                  <td className="py-2 px-4 border-b">{result.id}</td>
                  <td className="py-2 px-4 border-b">{result.prompt_id}</td>
                  <td className="py-2 px-4 border-b">{result.timestamp}</td>
                  <td className="py-2 px-4 border-b">{result.language}</td>
                  <td className="py-2 px-4 border-b">{result.prompt}</td>
                  <td className="py-2 px-4 border-b">{result.generation_a}</td>
                  <td className="py-2 px-4 border-b">{result.generation_b}</td>
                  <td className="py-2 px-4 border-b">{result.vote}</td>
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