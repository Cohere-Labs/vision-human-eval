import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';

// Define the structure of the prompt data returned from the backend
interface PromptData {
  prompt_id: string;
  text: string;
  image: string;
  model1: {
    name: string;
    response: string;
  };
  model2: {
    name: string;
    response: string;
  };
}

const App: React.FC = () => {
  const [languages, setLanguages] = useState<string[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>('');
  const [promptData, setPromptData] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchLanguages = async () => {
    try {
      const response = await fetch('/api/languages');
      const data = await response.json();
      setLanguages(data.languages);
      if (data.languages.length > 0) {
        setSelectedLang(data.languages[0]);
      }
    } catch (err) {
      console.error('Error fetching languages:', err);
    }
  };

  const fetchPrompt = async () => {
    if (!selectedLang) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/prompt?language=${encodeURIComponent(selectedLang)}`);
      const data = await response.json();
      setPromptData(data);
    } catch (err) {
      console.error('Error fetching prompt:', err);
    }
    setLoading(false);
  };

  const handleVote = async (winner: string) => {
    if (!promptData) return;
    // Log model names for debugging
    console.debug('Model A:', promptData.model1.name, 'Model B:', promptData.model2.name);

    const vote = {
      prompt_id: promptData.prompt_id,
      prompt_text: promptData.text,
      timestamp: new Date().toISOString(),
      model1: promptData.model1.name,
      model2: promptData.model2.name,
      winner: winner,
      language: selectedLang
    };
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vote)
      });
      if (response.ok) {
        alert('Vote recorded!');
        fetchPrompt(); // Load new prompt after vote
      } else {
        alert('Failed to record vote.');
      }
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    fetchPrompt();
  }, [selectedLang]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Chatbot Arena</h1>
        
        <Tabs value={selectedLang} onValueChange={setSelectedLang} className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-2 mb-8">
            {languages.map((lang) => (
              <TabsTrigger
                key={lang}
                value={lang}
                className={`px-4 py-2 rounded-lg transition-colors
                  ${selectedLang === lang 
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
              >
                {lang}
              </TabsTrigger>
            ))}
          </TabsList>

          {loading && (
            <div className="text-center text-muted-foreground">Loading...</div>
          )}

          {promptData && (
            <div className="space-y-8">
              <div className="bg-card rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-semibold mb-4">Prompt</h2>
                <p className="text-card-foreground mb-4">{promptData.text}</p>
                {promptData.image && (
                  <img
                    src={promptData.image}
                    alt="Prompt"
                    className="w-full max-w-2xl mx-auto rounded-lg"
                  />
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Model A Response */}
                <div className="bg-card rounded-lg p-6 shadow-lg">
                  <h3 className="text-xl font-semibold mb-2">Response A</h3>
                  <p className="text-card-foreground mb-6">{promptData.model1.response}</p>
                  <button
                    onClick={() => handleVote('model1')}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    A is Better
                  </button>
                </div>

                {/* Model B Response */}
                <div className="bg-card rounded-lg p-6 shadow-lg">
                  <h3 className="text-xl font-semibold mb-2">Response B</h3>
                  <p className="text-card-foreground mb-6">{promptData.model2.response}</p>
                  <button
                    onClick={() => handleVote('model2')}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    B is Better
                  </button>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleVote('tie')}
                  className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  Tie
                </button>
                <button
                  onClick={() => handleVote('both_bad')}
                  className="px-6 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                >
                  Both are Bad
                </button>
              </div>
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default App; 