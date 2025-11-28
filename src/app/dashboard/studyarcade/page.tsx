"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import Sidebar from "../components/Sidebar";

type Game = {
  id: string;
  name: string;
  description: string;
  icon: string;
  subjects: string[];
};

const allGames: Game[] = [
  {
    id: "match-pairs",
    name: "Match the Pairs",
    description: "Match terms, formulas, events, and diagrams",
    icon: "📚",
    subjects: ["All"],
  },
  {
    id: "quick-5",
    name: "Quick 5",
    description: "5 ultra-fast questions in 30 seconds",
    icon: "🧠",
    subjects: ["All"],
  },
  {
    id: "word-sprint",
    name: "Word Sprint",
    description: "Speed-based vocabulary game with synonyms and antonyms",
    icon: "⚡",
    subjects: ["English"],
  },
  {
    id: "reaction-puzzle",
    name: "Science Reaction Puzzle",
    description: "Drag reactants to form correct products",
    icon: "🧪",
    subjects: ["Chemistry", "Science"],
  },
  {
    id: "mcq-speedrun",
    name: "MCQ Speed Run",
    description: "Answer as many MCQs as possible in 1 minute",
    icon: "🎲",
    subjects: ["All"],
  },
  {
    id: "equation-builder",
    name: "Equation Builder",
    description: "Create target equations from given numbers and symbols",
    icon: "⚙️",
    subjects: ["Mathematics", "Physics"],
  },
  {
    id: "concept-blocks",
    name: "Concept Puzzle Blocks",
    description: "Tetris-style game with educational blocks",
    icon: "🧩",
    subjects: ["All"],
  },
  {
    id: "spelling-ninja",
    name: "Spelling Ninja",
    description: "Tap wrong letters as words slowly appear",
    icon: "🔤",
    subjects: ["English"],
  },
  {
    id: "odd-one-out",
    name: "Odd One Out",
    description: "Pick the option that doesn't belong",
    icon: "🔍",
    subjects: ["Science", "English", "All"],
  },
  {
    id: "math-sprint",
    name: "Math Sprint",
    description: "Simple arithmetic with increasing difficulty",
    icon: "🔢",
    subjects: ["Mathematics"],
  },
  {
    id: "sequence-builder",
    name: "Sequence Builder",
    description: "Put steps in correct order",
    icon: "🧬",
    subjects: ["Biology", "Chemistry", "Science"],
  },
];

export default function StudyArcadePage() {
  const { user, isLoaded } = useUser();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      fetchStats();
    }
  }, [isLoaded, user]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleGameSelect = async (game: Game) => {
    if (!stats) {
      await fetchStats();
      return;
    }

    if (stats.games_played_today >= 3) {
      alert("You've reached your daily limit of 3 games! Come back tomorrow to play more.");
      return;
    }

    setSelectedGame(game);
  };

  const handleGameComplete = async (gameId: string) => {
    try {
      await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }), // Only track game play, no XP
      });
      await fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  };

  if (!isLoaded || loadingStats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#5A4FFF] border-t-transparent"></div>
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  const handleBackToSelection = () => {
    setSelectedGame(null);
  };

  const renderGame = () => {
    if (!selectedGame) return null;

    const props = {
      classValue: "",
      board: "",
      subject: "",
      onBack: handleBackToSelection,
      onComplete: handleGameComplete,
      gameId: selectedGame.id,
    };

    switch (selectedGame.id) {
      case "diagram-label":
        return <DiagramLabelChallenge {...props} />;
      case "quick-5":
        return <Quick5 {...props} />;
      case "match-pairs":
        return <MatchPairs {...props} />;
      case "word-sprint":
        return <WordSprint {...props} />;
      case "reaction-puzzle":
        return <ReactionPuzzle {...props} />;
      case "mcq-speedrun":
        return <MCQSpeedRun {...props} />;
      case "equation-builder":
        return <EquationBuilder {...props} />;
      case "concept-blocks":
        return <ConceptBlocks {...props} />;
      case "spelling-ninja":
        return <SpellingNinja {...props} />;
      case "map-race":
        return <MapRace {...props} />;
      case "odd-one-out":
        return <OddOneOut {...props} />;
      case "math-sprint":
        return <MathSprint {...props} />;
      case "sequence-builder":
        return <SequenceBuilder {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="mx-auto flex w-full items-center justify-between px-5 py-4 section-max-width sm:px-6 lg:px-8">
            <h1 className="text-lg font-semibold text-slate-100">StudyArcade</h1>
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-2 md:flex">
                <span className="text-xs text-slate-400">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </span>
              </div>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            </div>
          </div>
        </header>

        <main className="mx-auto section-max-width px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
          {selectedGame ? (
            renderGame()
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-100 mb-2">Choose Your Game</h2>
                    <p className="text-sm text-slate-400">
                      Select any game to start playing and learning!
                    </p>
                  </div>
                  {stats && (
                    <div className="flex gap-4 text-sm">
                      <div className="bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700">
                        <div className="text-slate-400 text-xs">Gaming Streak</div>
                        <div className="text-orange-400 font-bold text-lg">🔥 {stats.current_streak || 0} days</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700">
                        <div className="text-slate-400 text-xs">Games Today</div>
                        <div className="text-cyan-400 font-bold text-lg">{stats.games_played_today || 0}/3</div>
                      </div>
                    </div>
                  )}
                </div>
                {stats && stats.games_played_today >= 3 && (
                  <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 text-sm">
                    ⚠️ You've reached your daily limit of 3 games. Come back tomorrow!
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allGames.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => handleGameSelect(game)}
                    className="group relative rounded-xl border border-slate-700/70 bg-slate-800/80 p-6 text-left transition-all hover:border-[#5A4FFF]/50 hover:bg-slate-800 hover:scale-105"
                  >
                    <div className="mb-3 text-4xl">{game.icon}</div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-100">{game.name}</h3>
                    <p className="text-sm text-slate-400">{game.description}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#5A4FFF] opacity-0 transition-opacity group-hover:opacity-100">
                      <span>Play Now</span>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// Game Components
type GameProps = {
  classValue: string;
  board: string;
  subject: string;
  onBack: () => void;
  onComplete?: (gameId: string) => void;
  gameId?: string;
};

// 1. Diagram Label Challenge
function DiagramLabelChallenge({ classValue, board, subject, onBack }: GameProps) {
  const [labels, setLabels] = useState<string[]>([]);
  const [placed, setPlaced] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  const diagramData = {
    "Biology": { labels: ["Nucleus", "Cell Membrane", "Cytoplasm", "Mitochondria"], target: "Cell" },
    "Geography": { labels: ["North", "South", "East", "West"], target: "Compass" },
  };

  useEffect(() => {
    const data = diagramData[subject as keyof typeof diagramData] || diagramData["Biology"];
    setLabels(data.labels.sort(() => Math.random() - 0.5));
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleDrop = (label: string) => {
    if (!placed.has(label)) {
      setPlaced(prev => new Set([...prev, label]));
      setScore(prev => prev + 10);
    }
  };

  return (
    <GameContainer title="Diagram Label Challenge" onBack={onBack} score={score} timeLeft={timeLeft}>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 min-h-96 flex items-center justify-center">
          <div className="text-6xl">📊</div>
        </div>
        <div>
          <h3 className="mb-4 text-slate-300">Drag labels to diagram</h3>
          <div className="space-y-2">
            {labels.filter(l => !placed.has(l)).map(label => (
              <div
                key={label}
                draggable
                onDragEnd={() => handleDrop(label)}
                className="p-3 bg-[#5A4FFF]/30 rounded-lg cursor-move hover:bg-[#5A4FFF]/50"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </GameContainer>
  );
}

// 3. Quick 5
function Quick5({ classValue, board, subject, onBack, onComplete, gameId }: GameProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selected, setSelected] = useState<number | null>(null);

  const questions = [
    { q: "What is 2+2?", options: ["3", "4", "5", "6"], correct: 1 },
    { q: "Capital of India?", options: ["Mumbai", "Delhi", "Kolkata", "Chennai"], correct: 1 },
    { q: "H₂O is?", options: ["Water", "Oxygen", "Hydrogen", "Salt"], correct: 0 },
    { q: "Largest planet?", options: ["Earth", "Jupiter", "Mars", "Venus"], correct: 1 },
    { q: "Photosynthesis produces?", options: ["Oxygen", "Carbon", "Nitrogen", "Hydrogen"], correct: 0 },
  ];

  useEffect(() => {
    if (timeLeft <= 0 || currentQ >= 5) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, currentQ]);

  const handleAnswer = (idx: number) => {
    setSelected(idx);
    if (idx === questions[currentQ].correct) {
      setScore(prev => prev + 1);
    }
    setTimeout(() => {
      if (currentQ < 4) {
        setCurrentQ(prev => prev + 1);
        setTimeLeft(30);
        setSelected(null);
      }
    }, 1000);
  };

  if (currentQ >= 5 || timeLeft <= 0) {
    if (onComplete && gameId) {
      onComplete(gameId);
    }
    return <GameOverScreen score={score} onBack={onBack} onRestart={() => window.location.reload()} />;
  }

  return (
    <GameContainer title="Quick 5" onBack={onBack} score={score} timeLeft={timeLeft}>
      <div className="text-center">
        <h2 className="text-2xl mb-6">{questions[currentQ].q}</h2>
        <div className="grid grid-cols-2 gap-4">
          {questions[currentQ].options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selected === i
                  ? selected === questions[currentQ].correct
                    ? "border-green-500 bg-green-500/20"
                    : "border-red-500 bg-red-500/20"
                  : "border-slate-600 hover:border-[#5A4FFF]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </GameContainer>
  );
}

// 4. Match Pairs
function MatchPairs({ classValue, board, subject, onBack, onComplete, gameId }: GameProps) {
  const [cards, setCards] = useState<Array<{id: string; content: string; type: 'term' | 'def'; pairId: number; flipped: boolean; matched: boolean}>>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);

  const pairs = [
    { term: "Photosynthesis", def: "Process by which plants make food" },
    { term: "Mitosis", def: "Cell division process" },
    { term: "Gravity", def: "Force that pulls objects down" },
    { term: "Atom", def: "Smallest unit of matter" },
  ];

  useEffect(() => {
    const newCards: typeof cards = [];
    pairs.forEach((pair, i) => {
      newCards.push({ id: `t${i}`, content: pair.term, type: 'term', pairId: i, flipped: false, matched: false });
      newCards.push({ id: `d${i}`, content: pair.def, type: 'def', pairId: i, flipped: false, matched: false });
    });
    setCards(newCards.sort(() => Math.random() - 0.5));
  }, []);

  const handleFlip = (id: string) => {
    if (flipped.length >= 2 || cards.find(c => c.id === id)?.flipped) return;
    
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [c1, c2] = newFlipped.map(id => cards.find(c => c.id === id)!);
      if (c1.pairId === c2.pairId) {
        setTimeout(() => {
          setCards(prev => prev.map(c => c.pairId === c1.pairId ? { ...c, matched: true } : c));
          setFlipped([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
          setFlipped([]);
        }, 1000);
      }
    }
  };

  const allMatched = cards.length > 0 && cards.every(c => c.matched);

  if (allMatched) {
    if (onComplete && gameId) {
      onComplete(gameId);
    }
    return <GameOverScreen score={moves} onBack={onBack} onRestart={() => window.location.reload()} />;
  }

  return (
    <GameContainer title="Match the Pairs" onBack={onBack} score={moves}>
      <div className="grid grid-cols-4 gap-4">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => handleFlip(card.id)}
            className={`aspect-square rounded-xl border-2 p-4 transition-all ${
              card.matched
                ? "border-green-500 bg-green-500/20"
                : card.flipped
                ? "border-[#5A4FFF] bg-[#5A4FFF]/20"
                : "border-slate-600 bg-slate-700/50"
            }`}
          >
            {card.flipped || card.matched ? (
              <div className="text-xs text-center">{card.content}</div>
            ) : (
              <div className="text-2xl">❓</div>
            )}
          </button>
        ))}
      </div>
    </GameContainer>
  );
}

// 5. Word Sprint
function WordSprint({ classValue, board, subject, onBack, onComplete, gameId }: GameProps) {
  const [word, setWord] = useState("");
  const [synonym, setSynonym] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  const wordData = [
    { word: "Happy", synonym: "Joyful", options: ["Sad", "Joyful", "Angry", "Tired"] },
    { word: "Big", synonym: "Large", options: ["Small", "Large", "Tiny", "Mini"] },
    { word: "Fast", synonym: "Quick", options: ["Slow", "Quick", "Lazy", "Calm"] },
  ];

  useEffect(() => {
    const data = wordData[Math.floor(Math.random() * wordData.length)];
    setWord(data.word);
    setSynonym(data.synonym);
    setOptions(data.options.sort(() => Math.random() - 0.5));
  }, [score]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswer = (opt: string) => {
    if (opt === synonym) {
      setScore(prev => prev + 1);
      const data = wordData[Math.floor(Math.random() * wordData.length)];
      setWord(data.word);
      setSynonym(data.synonym);
      setOptions(data.options.sort(() => Math.random() - 0.5));
    }
  };

  if (timeLeft <= 0) {
    if (onComplete && gameId) {
      onComplete(gameId);
    }
    return <GameOverScreen score={score} onBack={onBack} onRestart={() => window.location.reload()} />;
  }

  return (
    <GameContainer title="Word Sprint" onBack={onBack} score={score} timeLeft={timeLeft}>
      <div className="text-center">
        <h2 className="text-3xl mb-4">Find synonym for: <span className="text-[#5A4FFF]">{word}</span></h2>
        <div className="grid grid-cols-2 gap-4">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              className="p-4 rounded-xl border-2 border-slate-600 hover:border-[#5A4FFF] bg-slate-800/50"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </GameContainer>
  );
}

// 6. Reaction Puzzle
function ReactionPuzzle({ classValue, board, subject, onBack }: GameProps) {
  const [reactants, setReactants] = useState<string[]>([]);
  const [product, setProduct] = useState("");
  const [score, setScore] = useState(0);

  const reactions = [
    { reactants: ["H₂", "O"], product: "H₂O" },
    { reactants: ["Na", "Cl"], product: "NaCl" },
    { reactants: ["C", "O₂"], product: "CO₂" },
  ];

  useEffect(() => {
    const reaction = reactions[Math.floor(Math.random() * reactions.length)];
    setReactants(reaction.reactants);
    setProduct(reaction.product);
  }, [score]);

  const handleDrop = (reactant: string) => {
    // Simplified - in real game, would check if correct combination
    setScore(prev => prev + 1);
    const reaction = reactions[Math.floor(Math.random() * reactions.length)];
    setReactants(reaction.reactants);
    setProduct(reaction.product);
  };

  return (
    <GameContainer title="Science Reaction Puzzle" onBack={onBack} score={score}>
      <div className="text-center">
        <h2 className="mb-6">Drag reactants to form: <span className="text-[#5A4FFF]">{product}</span></h2>
        <div className="flex gap-4 justify-center mb-6">
          {reactants.map((r, i) => (
            <div
              key={i}
              draggable
              onDragEnd={() => handleDrop(r)}
              className="p-4 bg-[#5A4FFF]/30 rounded-lg cursor-move"
            >
              {r}
            </div>
          ))}
        </div>
        <div className="p-8 bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-600">
          Drop here
        </div>
      </div>
    </GameContainer>
  );
}

// 7. MCQ Speed Run
function MCQSpeedRun({ classValue, board, subject, onBack, onComplete, gameId }: GameProps) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentQ, setCurrentQ] = useState(0);
  const [usedQuestions, setUsedQuestions] = useState<Set<number>>(new Set());

  const questions = [
    { q: "What is 5×5?", options: ["20", "25", "30", "35"], correct: 1 },
    { q: "Capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correct: 2 },
    { q: "H₂O stands for?", options: ["Water", "Oxygen", "Hydrogen", "Salt"], correct: 0 },
    { q: "What is 10+15?", options: ["20", "25", "30", "35"], correct: 1 },
    { q: "Largest planet?", options: ["Earth", "Jupiter", "Mars", "Venus"], correct: 1 },
    { q: "Photosynthesis produces?", options: ["Oxygen", "Carbon", "Nitrogen", "Hydrogen"], correct: 0 },
    { q: "What is 8×7?", options: ["54", "56", "58", "60"], correct: 1 },
    { q: "Capital of India?", options: ["Mumbai", "Delhi", "Kolkata", "Chennai"], correct: 1 },
    { q: "CO₂ stands for?", options: ["Carbon Dioxide", "Carbon Monoxide", "Calcium Oxide", "Copper Oxide"], correct: 0 },
    { q: "What is 12÷3?", options: ["3", "4", "5", "6"], correct: 1 },
    { q: "Smallest prime number?", options: ["0", "1", "2", "3"], correct: 2 },
    { q: "Speed of light?", options: ["3×10⁸ m/s", "3×10⁶ m/s", "3×10¹⁰ m/s", "3×10⁴ m/s"], correct: 0 },
  ];

  const getNextQuestion = () => {
    const available = questions.map((_, i) => i).filter(i => !usedQuestions.has(i));
    if (available.length === 0) {
      // Reset if all questions used
      setUsedQuestions(new Set());
      return Math.floor(Math.random() * questions.length);
    }
    return available[Math.floor(Math.random() * available.length)];
  };

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswer = (idx: number) => {
    if (idx === questions[currentQ].correct) {
      setScore(prev => prev + 1);
    }
    const nextQ = getNextQuestion();
    setUsedQuestions(prev => new Set([...prev, currentQ]));
    setCurrentQ(nextQ);
  };

  if (timeLeft <= 0) {
    if (onComplete && gameId) {
      onComplete(gameId);
    }
    return <GameOverScreen score={score} onBack={onBack} onRestart={() => window.location.reload()} />;
  }

  return (
    <GameContainer title="MCQ Speed Run" onBack={onBack} score={score} timeLeft={timeLeft}>
      <div className="text-center">
        <h2 className="text-2xl mb-6">{questions[currentQ].q}</h2>
        <div className="grid grid-cols-2 gap-4">
          {questions[currentQ].options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className="p-4 rounded-xl border-2 border-slate-600 hover:border-[#5A4FFF] bg-slate-800/50 transition-all hover:scale-105"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </GameContainer>
  );
}

// 8. Equation Builder
function EquationBuilder({ classValue, board, subject, onBack }: GameProps) {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [target, setTarget] = useState(0);
  const [equation, setEquation] = useState("");
  const [score, setScore] = useState(0);

  useEffect(() => {
    const nums = [2, 3, 5, 7, 10];
    setNumbers(nums.sort(() => Math.random() - 0.5));
    setTarget(15);
  }, [score]);

  const handleNumberClick = (num: number) => {
    setEquation(prev => prev + num.toString());
  };

  const handleOperatorClick = (op: string) => {
    setEquation(prev => prev + op);
  };

  const calculateEquation = (eq: string): number | null => {
    try {
      // Replace display operators with JS operators
      const normalized = eq.replace(/×/g, '*').replace(/÷/g, '/');
      // Use Function constructor instead of eval for better security
      const result = new Function('return ' + normalized)();
      return typeof result === 'number' ? result : null;
    } catch {
      return null;
    }
  };

  const handleSubmit = () => {
    const result = calculateEquation(equation);
    if (result === target) {
      setScore(prev => prev + 1);
      setEquation("");
      const nums = [2, 3, 5, 7, 10];
      setNumbers(nums.sort(() => Math.random() - 0.5));
      setTarget(15);
    }
  };

  return (
    <GameContainer title="Equation Builder" onBack={onBack} score={score}>
      <div className="text-center">
        <h2 className="text-2xl mb-4">Target: <span className="text-[#5A4FFF]">{target}</span></h2>
        <div className="mb-4 p-4 bg-slate-800/50 rounded-xl min-h-12">
          {equation || "Build equation..."}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {numbers.map((n, i) => (
            <button
              key={i}
              onClick={() => handleNumberClick(n)}
              className="p-4 bg-[#5A4FFF]/30 rounded-lg hover:bg-[#5A4FFF]/50"
            >
              {n}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {['+', '-', '×', '÷'].map(op => (
            <button
              key={op}
              onClick={() => handleOperatorClick(op)}
              className="p-4 bg-purple-600/30 rounded-lg hover:bg-purple-600/50"
            >
              {op}
            </button>
          ))}
        </div>
        <button
          onClick={handleSubmit}
          className="w-full p-4 bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8] rounded-xl"
        >
          Submit
        </button>
      </div>
    </GameContainer>
  );
}

// 9. Concept Blocks
function ConceptBlocks({ classValue, board, subject, onBack, onComplete, gameId }: GameProps) {
  const [blocks, setBlocks] = useState<Array<{id: number; concept: string; y: number; x: number; category: string}>>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const concepts = {
    "Biology": ["Cell", "Tissue", "Organ", "System"],
    "Chemistry": ["Atom", "Molecule", "Compound", "Element"],
    "Physics": ["Force", "Energy", "Power", "Work"],
    "Math": ["Number", "Equation", "Formula", "Theorem"],
  };

  const getCategory = () => {
    const subjectKey = Object.keys(concepts).find(k => 
      subject.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(subject.toLowerCase())
    ) || "Biology";
    return subjectKey;
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      const category = getCategory();
      const conceptList = concepts[category as keyof typeof concepts] || concepts["Biology"];
      const allCategories = Object.keys(concepts);
      // Randomly assign category - 60% chance for correct category, 40% for others
      const randomCategory = Math.random() < 0.6 
        ? category 
        : allCategories[Math.floor(Math.random() * allCategories.length)];
      const randomConceptList = concepts[randomCategory as keyof typeof concepts] || concepts["Biology"];
      
      setBlocks(prev => [...prev, {
        id: Date.now() + Math.random(),
        concept: randomConceptList[Math.floor(Math.random() * randomConceptList.length)],
        y: -5,
        x: Math.floor(Math.random() * 4) * 25,
        category: randomCategory,
      }]);
    }, 2000);

    const moveInterval = setInterval(() => {
      setBlocks(prev => {
        const updated = prev.map(b => ({ ...b, y: b.y + 0.5 }));
        const missed = updated.filter(b => b.y > 100);
        if (missed.length > 0) {
          setLives(prevLives => {
            const newLives = prevLives - missed.length;
            if (newLives <= 0) {
              setGameOver(true);
            }
            return newLives;
          });
        }
        return updated.filter(b => b.y <= 100);
      });
    }, 50);

    return () => {
      clearInterval(interval);
      clearInterval(moveInterval);
    };
  }, [gameStarted, gameOver, subject]);

  const handleBlockClick = (blockId: number, category: string) => {
    if (selectedCategory && selectedCategory === category) {
      setScore(prev => prev + 1);
      setBlocks(prev => prev.filter(b => b.id !== blockId));
    } else {
      setLives(prevLives => {
        const newLives = prevLives - 1;
        if (newLives <= 0) {
          setGameOver(true);
        }
        return newLives;
      });
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setBlocks([]);
    const category = getCategory();
    setSelectedCategory(category);
  };

  if (!gameStarted) {
    return (
      <GameContainer title="Concept Puzzle Blocks" onBack={onBack}>
        <div className="text-center">
          <div className="mb-6 text-6xl">🧩</div>
          <h3 className="mb-4 text-xl font-semibold text-slate-100">Click blocks from the selected category!</h3>
          <p className="mb-6 text-slate-400">Blocks will fall. Click only blocks from your subject category to score points!</p>
          <button
            onClick={startGame}
            className="rounded-xl bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 hover:from-[#4A3DF5] hover:to-[#00B298] transition-all transform hover:scale-105"
          >
            Start Game
          </button>
        </div>
      </GameContainer>
    );
  }

  if (gameOver) {
    if (onComplete && gameId) {
      onComplete(gameId);
    }
    return <GameOverScreen score={score} onBack={onBack} onRestart={startGame} />;
  }

  return (
    <GameContainer title="Concept Puzzle Blocks" onBack={onBack} score={score} lives={lives}>
      <div className="mb-4 p-3 bg-[#5A4FFF]/20 rounded-lg border border-[#5A4FFF]/50">
        <p className="text-sm text-slate-300 text-center">
          Click blocks from category: <span className="font-bold text-[#5A4FFF]">{selectedCategory}</span>
        </p>
      </div>
      <div className="relative h-[500px] bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-red-400 to-red-500"></div>
        {blocks.map(block => (
          <button
            key={block.id}
            onClick={() => handleBlockClick(block.id, block.category)}
            className={`absolute p-3 rounded-lg text-white font-medium text-sm transition-all hover:scale-110 ${
              block.category === selectedCategory
                ? "bg-gradient-to-r from-green-500/80 to-emerald-500/80"
                : "bg-gradient-to-r from-red-500/80 to-rose-500/80"
            }`}
            style={{
              left: `${block.x}%`,
              top: `${block.y}%`,
              transform: 'translateY(-50%)',
            }}
          >
            {block.concept}
          </button>
        ))}
        {blocks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-slate-400 text-center">
              <div className="text-4xl mb-2">⬇️</div>
              <p>Blocks will appear here...</p>
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 text-center text-sm text-slate-400">
        Click only {selectedCategory} blocks to score! Wrong category = lose a life!
      </div>
    </GameContainer>
  );
}

// 10. Spelling Ninja
function SpellingNinja({ classValue, board, subject, onBack, onComplete, gameId }: GameProps) {
  const [word, setWord] = useState("");
  const [displayed, setDisplayed] = useState("");
  const [wrongLetters, setWrongLetters] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  const words = ["EDUCATION", "KNOWLEDGE", "SCIENCE", "MATHEMATICS"];

  useEffect(() => {
    const w = words[Math.floor(Math.random() * words.length)];
    setWord(w);
    setDisplayed("");
    setWrongLetters([]);
    let index = 0;
    const interval = setInterval(() => {
      if (index < w.length) {
        setDisplayed(prev => prev + w[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [score]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleLetterClick = (letter: string) => {
    if (!word.includes(letter)) {
      setWrongLetters(prev => [...prev, letter]);
      setScore(prev => prev + 1);
    }
  };

  if (timeLeft <= 0) {
    if (onComplete && gameId) {
      onComplete(gameId);
    }
    return <GameOverScreen score={score} onBack={onBack} onRestart={() => window.location.reload()} />;
  }

  return (
    <GameContainer title="Spelling Ninja" onBack={onBack} score={score} timeLeft={timeLeft}>
      <div className="text-center">
        <h2 className="text-4xl mb-6 font-mono">{displayed}</h2>
        <div className="grid grid-cols-6 gap-2">
          {Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ").map(letter => (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              className={`p-3 rounded-lg ${
                wrongLetters.includes(letter)
                  ? "bg-red-500/50"
                  : "bg-slate-700/50 hover:bg-slate-600"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    </GameContainer>
  );
}

// 11. Map Race
function MapRace({ classValue, board, subject, onBack, onComplete, gameId }: GameProps) {
  const [targets, setTargets] = useState<Array<{id: number; name: string; x: number; y: number; clicked: boolean}>>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  const locations = [
    { name: "Delhi", x: 50, y: 30 },
    { name: "Mumbai", x: 30, y: 60 },
    { name: "Kolkata", x: 70, y: 40 },
    { name: "Chennai", x: 45, y: 75 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const loc = locations[Math.floor(Math.random() * locations.length)];
      setTargets(prev => [...prev, { ...loc, id: Date.now(), clicked: false }]);
    }, 3000);

    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  const handleClick = (id: number) => {
    setTargets(prev => prev.map(t => t.id === id ? { ...t, clicked: true } : t));
    setScore(prev => prev + 1);
  };

  if (timeLeft <= 0) {
    if (onComplete && gameId) {
      onComplete(gameId);
    }
    return <GameOverScreen score={score} onBack={onBack} onRestart={() => window.location.reload()} />;
  }

  return (
    <GameContainer title="Map Race" onBack={onBack} score={score} timeLeft={timeLeft}>
      <div className="relative h-96 bg-slate-800/50 rounded-xl border border-slate-700">
        {targets.filter(t => !t.clicked).map(target => (
          <button
            key={target.id}
            onClick={() => handleClick(target.id)}
            className="absolute p-2 bg-[#5A4FFF] rounded-lg text-white text-xs transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${target.x}%`, top: `${target.y}%` }}
          >
            {target.name}
          </button>
        ))}
      </div>
    </GameContainer>
  );
}

// 13. Odd One Out
function OddOneOut({ classValue, board, subject, onBack }: GameProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [correct, setCorrect] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string>("");
  const [gameStarted, setGameStarted] = useState(false);

  const questions = [
    { options: ["Apple", "Banana", "Car", "Orange"], correct: 2, reason: "Car is not a fruit" },
    { options: ["Dog", "Cat", "Bird", "Fish"], correct: 1, reason: "Cat is the only one that can't fly or swim well" },
    { options: ["Math", "Science", "English", "History"], correct: 0, reason: "Math is the only exact science" },
    { options: ["Water", "Oxygen", "Fire", "Air"], correct: 2, reason: "Fire is not a natural element in the same way" },
    { options: ["Triangle", "Square", "Circle", "Rectangle"], correct: 2, reason: "Circle has no straight edges" },
    { options: ["H₂O", "CO₂", "NaCl", "O₂"], correct: 2, reason: "NaCl is a compound, others are molecules" },
    { options: ["Heart", "Lung", "Brain", "Stomach"], correct: 2, reason: "Brain is not an organ that pumps or filters" },
  ];

  useEffect(() => {
    if (!gameStarted) return;
    const q = questions[Math.floor(Math.random() * questions.length)];
    setOptions(q.options);
    setCorrect(q.correct);
    setFeedback("");
  }, [score, gameStarted]);

  const handleAnswer = (idx: number) => {
    const currentQ = questions.find(q => 
      JSON.stringify(q.options) === JSON.stringify(options)
    );
    
    if (idx === correct) {
      setScore(prev => prev + 1);
      setFeedback(`Correct! ${currentQ?.reason || ""}`);
      setTimeout(() => {
        const q = questions[Math.floor(Math.random() * questions.length)];
        setOptions(q.options);
        setCorrect(q.correct);
        setFeedback("");
      }, 1500);
    } else {
      setFeedback(`Wrong! The odd one out is: ${options[correct]}. ${currentQ?.reason || ""}`);
      setTimeout(() => {
        const q = questions[Math.floor(Math.random() * questions.length)];
        setOptions(q.options);
        setCorrect(q.correct);
        setFeedback("");
      }, 2000);
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    const q = questions[Math.floor(Math.random() * questions.length)];
    setOptions(q.options);
    setCorrect(q.correct);
    setFeedback("");
  };

  if (!gameStarted) {
    return (
      <GameContainer title="Odd One Out" onBack={onBack}>
        <div className="text-center">
          <div className="mb-6 text-6xl">🔍</div>
          <h3 className="mb-4 text-xl font-semibold text-slate-100">Find the one that doesn't belong!</h3>
          <p className="mb-6 text-slate-400">Click on the option that is different from the others</p>
          <button
            onClick={startGame}
            className="rounded-xl bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 hover:from-[#4A3DF5] hover:to-[#00B298] transition-all transform hover:scale-105"
          >
            Start Game
          </button>
        </div>
      </GameContainer>
    );
  }

  return (
    <GameContainer title="Odd One Out" onBack={onBack} score={score}>
      <div className="text-center">
        <h2 className="text-2xl mb-6">Which one doesn't belong?</h2>
        {feedback && (
          <div className={`mb-4 p-3 rounded-lg ${
            feedback.startsWith("Correct") 
              ? "bg-green-500/20 text-green-400 border border-green-500/50" 
              : "bg-red-500/20 text-red-400 border border-red-500/50"
          }`}>
            {feedback}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                feedback && i === correct
                  ? "border-green-500 bg-green-500/20"
                  : feedback && i !== correct
                  ? "border-red-500/50 bg-red-500/10"
                  : "border-slate-600 hover:border-[#5A4FFF] bg-slate-800/50"
              }`}
            >
              <div className="text-lg font-semibold">{opt}</div>
            </button>
          ))}
        </div>
      </div>
    </GameContainer>
  );
}

// 14. Math Sprint
function MathSprint({ classValue, board, subject, onBack, onComplete, gameId }: GameProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    setNum1(Math.floor(Math.random() * 20) + 1);
    setNum2(Math.floor(Math.random() * 20) + 1);
  }, [score]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(answer) === num1 + num2) {
      setScore(prev => prev + 1);
      setAnswer("");
      setNum1(Math.floor(Math.random() * 20) + 1);
      setNum2(Math.floor(Math.random() * 20) + 1);
    }
  };

  if (timeLeft <= 0) {
    if (onComplete && gameId) {
      onComplete(gameId);
    }
    return <GameOverScreen score={score} onBack={onBack} onRestart={() => window.location.reload()} />;
  }

  return (
    <GameContainer title="Math Sprint" onBack={onBack} score={score} timeLeft={timeLeft}>
      <div className="text-center">
        <h2 className="text-5xl mb-8">{num1} + {num2} = ?</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full p-4 text-2xl text-center bg-slate-800/50 rounded-xl border-2 border-[#5A4FFF] mb-4"
            autoFocus
          />
          <button type="submit" className="w-full p-4 bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8] rounded-xl">
            Submit
          </button>
        </form>
      </div>
    </GameContainer>
  );
}

// 15. Sequence Builder
function SequenceBuilder({ classValue, board, subject, onBack }: GameProps) {
  const [steps, setSteps] = useState<string[]>([]);
  const [ordered, setOrdered] = useState<string[]>([]);
  const [score, setScore] = useState(0);

  const sequences = {
    "Biology": {
      correct: ["Interphase", "Prophase", "Metaphase", "Anaphase", "Telophase"],
      shuffled: ["Metaphase", "Interphase", "Telophase", "Prophase", "Anaphase"],
    },
    "Chemistry": {
      correct: ["Reactants", "Reaction", "Products"],
      shuffled: ["Products", "Reactants", "Reaction"],
    },
  };

  useEffect(() => {
    const seq = sequences[subject as keyof typeof sequences] || sequences["Biology"];
    setSteps(seq.shuffled);
    setOrdered([]);
  }, [score]);

  const handleStepClick = (step: string) => {
    setSteps(prev => prev.filter(s => s !== step));
    setOrdered(prev => [...prev, step]);
  };

  const handleCheck = () => {
    const seq = sequences[subject as keyof typeof sequences] || sequences["Biology"];
    if (JSON.stringify(ordered) === JSON.stringify(seq.correct)) {
      setScore(prev => prev + 1);
      const newSeq = sequences[subject as keyof typeof sequences] || sequences["Biology"];
      setSteps(newSeq.shuffled);
      setOrdered([]);
    }
  };

  return (
    <GameContainer title="Sequence Builder" onBack={onBack} score={score}>
      <div>
        <h3 className="mb-4 text-slate-300">Click steps in order:</h3>
        <div className="space-y-2 mb-6">
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={() => handleStepClick(step)}
              className="w-full p-3 bg-slate-700/50 rounded-lg hover:bg-slate-600"
            >
              {step}
            </button>
          ))}
        </div>
        <div className="mb-4">
          <h3 className="mb-2 text-slate-300">Your sequence:</h3>
          <div className="flex gap-2">
            {ordered.map((step, i) => (
              <div key={i} className="p-2 bg-[#5A4FFF]/30 rounded">
                {step}
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={handleCheck}
          className="w-full p-4 bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8] rounded-xl"
        >
          Check
        </button>
      </div>
    </GameContainer>
  );
}

// Shared Components
function GameContainer({ 
  title, 
  onBack, 
  score, 
  lives, 
  timeLeft, 
  children 
}: { 
  title: string; 
  onBack: () => void; 
  score?: number; 
  lives?: number; 
  timeLeft?: number; 
  children: React.ReactNode;
}) {
  return (
    <div className="neo-card rounded-xl border border-slate-700/70 bg-slate-800/80 p-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(90,79,255,0.3),transparent_70%)]"></div>
      </div>
      
      <div className="mb-6 flex items-center justify-between relative z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex gap-4 text-sm">
          {score !== undefined && <div className="text-slate-400">Score: <span className="text-[#5A4FFF] font-bold">{score}</span></div>}
          {lives !== undefined && <div className="text-slate-400">Lives: <span className="text-red-400 font-bold">{lives} ❤️</span></div>}
          {timeLeft !== undefined && <div className="text-slate-400">Time: <span className="text-cyan-400 font-bold">{timeLeft}s</span></div>}
        </div>
      </div>

      <h2 className="mb-6 text-2xl font-semibold text-slate-100 relative z-10">{title}</h2>
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

function GameOverScreen({ 
  score, 
  onBack, 
  onRestart 
}: { 
  score: number; 
  onBack: () => void; 
  onRestart: () => void;
}) {
  return (
    <div className="neo-card rounded-xl border border-slate-700/70 bg-slate-800/80 p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 animate-pulse"></div>
      <div className="text-center relative z-10">
        <div className="mx-auto mb-4 text-6xl animate-bounce">🎉</div>
        <h2 className="mb-2 text-2xl font-semibold text-slate-100">Game Over!</h2>
        <p className="mb-6 text-slate-400">Final Score: {score}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onRestart}
            className="rounded-xl bg-gradient-to-r from-[#5A4FFF] to-[#00C2A8] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 hover:from-[#4A3DF5] hover:to-[#00B298] transition-all transform hover:scale-105"
          >
            Play Again
          </button>
          <button
            onClick={onBack}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Back to Games
          </button>
        </div>
      </div>
    </div>
  );
}
