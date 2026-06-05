import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun,
  Moon,
  Briefcase, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  ChevronRight, 
  User, 
  Search,
  Plus,
  ArrowRight,
  BrainCircuit,
  BarChart3,
  Map,
  Clock,
  ExternalLink,
  Upload,
  FileText,
  X,
  LogIn,
  ShieldCheck,
  Mail,
  Lock,
  Download,
  FileDown,
  Info,
  Activity,
  Rocket
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Chatbot } from './components/Chatbot';
import { Assessment } from './components/Assessment';
import { Tooltip } from './components/Tooltip';
import { geminiService, Skill, CareerRecommendation, RoadmapStep } from './services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

// Types
type View = 'login' | 'landing' | 'onboarding' | 'dashboard' | 'recommendations' | 'roadmap' | 'assessment';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [currentRole, setCurrentRole] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [transitionDuration, setTransitionDuration] = useState('6 months');
  const [interests, setInterests] = useState('');
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [selectedRole, setSelectedRole] = useState<CareerRecommendation | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [roadmapId, setRoadmapId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [assessmentQuestions, setAssessmentQuestions] = useState<any[]>([]);
  const [isAssessmentLoading, setIsAssessmentLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showReinforcement, setShowReinforcement] = useState(false);
  const [reinforcementMessage, setReinforcementMessage] = useState('');
  const [hoveredResource, setHoveredResource] = useState<{ stepIndex: number, resIndex: number } | null>(null);
  const [coachingTips, setCoachingTips] = useState<string[]>([]);
  const [isCoachingLoading, setIsCoachingLoading] = useState(false);
  const [isExporting, setIsExporting] = useState<'pdf' | 'word' | null>(null);

  // Mock User ID for demo
  const userId = 'demo-user-123';

  useEffect(() => {
    fetchUser();
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/user/${userId}`);
      const data = await res.json();
      if (data.id) {
        setUser(data);
        setSkills(data.skills || []);
        setCurrentRole(data.currentRole || '');
        setTargetRole(data.targetRole || '');
        setInterests(data.interests || '');
        
        // Generate coaching tips if we have a profile
        if (data.currentRole && data.targetRole) {
          generateCoachingTips(data.currentRole, data.targetRole, data.skills || []);
        }

        // Fetch roadmap
        const roadmapRes = await fetch(`/api/roadmap/${userId}`);
        const roadmapData = await roadmapRes.json();
        if (roadmapData) {
          setRoadmap(roadmapData.steps);
          setRoadmapId(roadmapData.id);
          setSelectedRole({ role: roadmapData.target_role, overlapScore: 0, difficulty: 'Unknown', reasoning: '', missingSkills: [], isTarget: true });
        }
        
        if (data.skills?.length > 0) setView('dashboard');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const generateCoachingTips = async (current: string, target: string, userSkills: Skill[]) => {
    setIsCoachingLoading(true);
    try {
      const tips = await geminiService.generateCoachingTips(current, target, userSkills);
      setCoachingTips(tips);
    } catch (e) {
      console.error('Failed to generate coaching tips:', e);
      setCoachingTips([
        "Focus on bridging the technical gap between your current and target roles.",
        "Network with professionals already in your desired field to gain insider insights.",
        "Consider specialized certifications that validate your expertise in target competencies.",
        "Update your professional narrative to highlight transferable achievements."
      ]);
    } finally {
      setIsCoachingLoading(false);
    }
  };

  const handleOnboardingNext = async () => {
    if (onboardingStep === 1) {
      if (!currentRole || !targetRole) return;
      setOnboardingStep(2);
    } else if (onboardingStep === 2) {
      if (!resumeText) return;
      setLoading(true);
      try {
        const extractedSkills = await geminiService.extractSkillsFromText(resumeText);
        setSkills(extractedSkills);
        setOnboardingStep(3);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    } else if (onboardingStep === 3) {
      setOnboardingStep(4);
    } else if (onboardingStep === 4) {
      setLoading(true);
      try {
        await getRecommendations();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOnboardingBack = () => {
    if (onboardingStep === 1) {
      setView('landing');
    } else {
      setOnboardingStep(prev => prev - 1);
    }
  };

  const handleOnboarding = async () => {
    // This is now handled by handleOnboardingNext
  };

  const handleDetailsSubmit = async () => {
    // This is now handled by handleOnboardingNext
  };

  const getRecommendations = async () => {
    setLoading(true);
    try {
      const recs = await geminiService.getCareerRecommendations(
        skills, 
        currentRole, 
        targetRole, 
        transitionDuration, 
        interests
      );
      setRecommendations(recs);
      
      // Generate coaching tips
      generateCoachingTips(currentRole, targetRole, skills);
      
      setView('recommendations');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async (role: CareerRecommendation) => {
    setLoading(true);
    setSelectedRole(role);
    try {
      const steps = await geminiService.generateRoadmap(skills, role.role);
      setRoadmap(steps);
      
      // Save to DB
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetRole: role.role, steps })
      });
      const data = await res.json();
      if (data.id) setRoadmapId(data.id);
      
      setView('roadmap');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleStepCompletion = async (index: number) => {
    const isCompleting = !roadmap[index].completed;
    const updatedRoadmap = roadmap.map((step, i) => 
      i === index ? { ...step, completed: !step.completed } : step
    );
    setRoadmap(updatedRoadmap);
    
    if (isCompleting) {
      const messages = [
        "Strategic milestone achieved.",
        "Competency validated.",
        "Path progression confirmed.",
        "Professional architecture strengthened.",
        "Skill gap successfully bridged."
      ];
      setReinforcementMessage(messages[Math.floor(Math.random() * messages.length)]);
      setShowReinforcement(true);
      setTimeout(() => setShowReinforcement(false), 3000);
    }

    if (roadmapId) {
      try {
        await fetch(`/api/roadmap/${roadmapId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ steps: updatedRoadmap })
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoggedIn(true);
      setView('landing');
      setLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setView('landing');
    setEmail('');
    setPassword('');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate password reset
    setTimeout(() => {
      alert(`Password reset link sent to ${email}!`);
      setIsResettingPassword(false);
      setLoading(false);
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    // Simulate Google login
    setTimeout(() => {
      setIsLoggedIn(true);
      setView('landing');
      setLoading(false);
    }, 1000);
  };

  const downloadAsPDF = async () => {
    if (!selectedRole || !roadmap.length) return;
    setIsExporting('pdf');
    
    try {
      const doc = new jsPDF();
      let y = 20;

      doc.setFontSize(22);
      doc.text(`Roadmap to ${selectedRole.role}`, 20, y);
      y += 15;

      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Generated by CareerPath AI`, 20, y);
      y += 15;

      roadmap.forEach((step, i) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text(`${i + 1}. ${step.title}`, 20, y);
        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Estimated Time: ${step.estimatedTime}`, 20, y);
        y += 8;

        doc.setFontSize(12);
        doc.setTextColor(50);
        const splitDescription = doc.splitTextToSize(step.description, 170);
        doc.text(splitDescription, 20, y);
        y += (splitDescription.length * 7) + 5;

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Resources:', 20, y);
        y += 5;
        step.resources.forEach(res => {
          doc.text(`- ${res}`, 25, y);
          y += 5;
        });
        y += 10;
      });

      doc.save(`Roadmap_${selectedRole.role.replace(/\s+/g, '_')}.pdf`);
      
      setReinforcementMessage("PDF Protocol exported successfully.");
      setShowReinforcement(true);
      setTimeout(() => setShowReinforcement(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(null);
    }
  };

  const downloadAsWord = async () => {
    if (!selectedRole || !roadmap.length) return;
    setIsExporting('word');

    try {
      const sections = roadmap.map((step, i) => [
        new Paragraph({
          text: `${i + 1}. ${step.title}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Estimated Time: ${step.estimatedTime}`,
              italics: true,
              color: "666666",
            }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: step.description,
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: "Resources:",
          heading: HeadingLevel.HEADING_4,
          spacing: { after: 100 },
        }),
        ...step.resources.map(res => new Paragraph({
          text: `- ${res}`,
          bullet: { level: 0 },
        })),
      ]).flat();

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: `Roadmap to ${selectedRole.role}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: "Generated by CareerPath AI",
              alignment: AlignmentType.CENTER,
              spacing: { after: 800 },
            }),
            ...sections,
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Roadmap_${selectedRole.role.replace(/\s+/g, '_')}.docx`);
      
      setReinforcementMessage("Word Protocol exported successfully.");
      setShowReinforcement(true);
      setTimeout(() => setShowReinforcement(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(null);
    }
  };

  const renderLogin = () => (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-300">
      <div className="max-w-md w-full mb-12 flex justify-between items-center">
        <Button variant="ghost" onClick={() => {
          if (isResettingPassword) {
            setIsResettingPassword(false);
          } else {
            setView('landing');
          }
        }} className="-ml-2 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500 dark:hover:text-white">
          <ChevronRight className="w-3 h-3 rotate-180 mr-1" /> {isResettingPassword ? 'Back to Login' : 'Back to Home'}
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>
      </div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card className="border-none shadow-none bg-transparent">
          <div className="text-center mb-12">
            <div className="ui-label mb-6">Authentication.Gateway</div>
            <h2 className="text-4xl font-serif italic text-zinc-900 dark:text-white mb-4 tracking-tight">
              {isResettingPassword ? 'Credential Recovery' : 'Access Terminal'}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 font-light">
              {isResettingPassword 
                ? 'Enter your registered email to initiate recovery.' 
                : 'Secure access to your professional architecture.'}
            </p>
          </div>

          {isResettingPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="ui-label">Email Address</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full p-3 rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white outline-none transition-all text-sm"
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button className="w-full h-12 rounded-none" loading={loading} type="submit">
                Initiate Recovery
              </Button>
            </form>
          ) : (
            <>
              <form onSubmit={handleLogin} className="space-y-8">
                <div className="space-y-4">
                  <label className="ui-label">Email Address</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full p-4 rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white outline-none transition-all text-base"
                    placeholder="name@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="ui-label">Password</label>
                    <button 
                      type="button"
                      onClick={() => setIsResettingPassword(true)}
                      className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    className="w-full p-4 rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white outline-none transition-all text-base"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button className="w-full h-14 rounded-none text-base" loading={loading} type="submit">
                  Authorize Access
                </Button>
              </form>

              <div className="relative my-12">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-[9px] font-mono uppercase tracking-[0.4em]">
                  <span className="bg-[#FAFAFA] dark:bg-zinc-950 px-6 text-zinc-400 dark:text-zinc-500">External Identity</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-14 rounded-none flex items-center justify-center gap-4 border-zinc-300 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all duration-300 group"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-sm font-medium tracking-wide dark:text-white">Continue with Google Identity</span>
              </Button>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Don't have an account? <button className="text-black dark:text-white font-semibold hover:underline">Create one</button>
            </p>
          </div>
        </Card>
        
        <div className="mt-8 flex items-center justify-center gap-2 text-zinc-400 dark:text-zinc-500 text-xs">
          <ShieldCheck className="w-4 h-4" />
          Secure, AI-powered career intelligence
        </div>
      </motion.div>
    </div>
  );

  const handleStartAssessment = async () => {
    setIsAssessmentLoading(true);
    try {
      const questions = await geminiService.generateAssessment(skills);
      setAssessmentQuestions(questions);
      setView('assessment');
    } catch (error) {
      console.error('Failed to generate assessment', error);
    } finally {
      setIsAssessmentLoading(false);
    }
  };

  const handleAssessmentComplete = (results: any) => {
    // In a real app, we'd update the skill levels based on results
    setSkills(prev => prev.map(s => ({
      ...s,
      level: Math.min(5, s.level + (results.percentage > 70 ? 1 : 0))
    })));
    setView('dashboard');
  };

  const tutorialSteps = [
    {
      title: "Welcome to CareerPath AI",
      description: "Your professional architect for strategic career transitions. Let's take a quick tour of how we'll help you reach your next milestone.",
      icon: BrainCircuit,
    },
    {
      title: "Phase 1: Objective Definition",
      description: "We start by defining your current position and your ultimate career goal. This sets the coordinates for your personalized roadmap.",
      icon: Target,
    },
    {
      title: "Phase 2: Experience Ingestion",
      description: "Upload your resume or paste your professional history. Our AI performs deep extraction to identify your unique skill signature.",
      icon: Upload,
    },
    {
      title: "Phase 3: Skill Refinement",
      description: "Review and validate the extracted skills. You have full control to add or remove competencies to ensure the highest accuracy.",
      icon: BrainCircuit,
    },
    {
      title: "Phase 4: Strategic Mapping",
      description: "Define your timeline and interests. We then generate a step-by-step roadmap with curated resources to bridge your skill gaps.",
      icon: Map,
    },
    {
      title: "Ready to Begin?",
      description: "Your journey starts with a single step. Initialize your path now and architect the future of your career.",
      icon: Rocket,
    }
  ];

  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(prev => prev + 1);
    } else {
      closeTutorial();
    }
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  const renderTutorial = () => {
    const step = tutorialSteps[tutorialStep];
    const Icon = step.icon;

    return (
      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="max-w-lg w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900 dark:bg-white" />
              
              <button 
                onClick={closeTutorial}
                className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-8 border border-zinc-100 dark:border-zinc-700">
                  <Icon className="w-8 h-8 text-zinc-900 dark:text-white" />
                </div>
                
                <div className="ui-label mb-4">Tutorial.Step_0{tutorialStep + 1}</div>
                <h3 className="text-3xl font-serif italic text-zinc-900 dark:text-white mb-6 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 font-light leading-relaxed mb-12">
                  {step.description}
                </p>

                <div className="flex items-center justify-between w-full pt-8 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex gap-2">
                    {tutorialSteps.map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                          i === tutorialStep ? 'bg-zinc-900 dark:bg-white w-4' : 'bg-zinc-200 dark:bg-zinc-800'
                        }`}
                      />
                    ))}
                  </div>
                  
                  <div className="flex gap-4">
                    {tutorialStep < tutorialSteps.length - 1 ? (
                      <>
                        <Button variant="ghost" onClick={closeTutorial} className="ui-label">Skip</Button>
                        <Button onClick={nextTutorialStep} className="rounded-none px-8">
                          Next <ChevronRight className="ml-2 w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button onClick={closeTutorial} className="rounded-none px-12">
                        Get Started
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const renderLanding = () => (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 flex flex-col transition-colors duration-300 overflow-hidden">
      <nav className="flex justify-between items-center px-12 py-8 w-full relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 dark:bg-white flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-white dark:text-zinc-900" />
          </div>
          <span className="font-serif italic text-2xl tracking-tight text-zinc-900 dark:text-white">CareerPath AI</span>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-8 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            <button className="hover:text-zinc-900 dark:hover:text-white transition-colors">Methodology</button>
            <button className="hover:text-zinc-900 dark:hover:text-white transition-colors">Intelligence</button>
            <button className="hover:text-zinc-900 dark:hover:text-white transition-colors">Enterprise</button>
          </div>
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block" />
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
            {!isLoggedIn ? (
              <Button variant="ghost" size="sm" onClick={() => setView('login')} className="text-[10px] font-mono uppercase tracking-[0.2em] dark:text-zinc-400 dark:hover:text-white">
                Sign In
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setView('dashboard')} className="text-[10px] font-mono uppercase tracking-[0.2em]">
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 relative z-10">
        {/* Left Pane - Content */}
        <div className="flex flex-col justify-center px-12 lg:px-24 py-12">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xl"
          >
            <div className="ui-label mb-6 flex items-center gap-3">
              <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-800" />
              Strategic Career Intelligence
            </div>
            <h1 className="text-7xl md:text-9xl font-serif italic text-zinc-900 dark:text-white mb-10 leading-[0.85] tracking-tighter">
              The Architecture of <span className="text-zinc-300 dark:text-zinc-700">Transition.</span>
            </h1>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 mb-14 font-light leading-relaxed max-w-lg">
              A professional-grade platform for skill validation and strategic career mapping. Leverage advanced AI to architect your next professional milestone with precision.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Button size="lg" onClick={() => isLoggedIn ? setView('onboarding') : setView('login')} className="rounded-none h-16 px-12">
                Initialize Path
                <ArrowRight className="ml-3 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-none h-16 px-12 border-zinc-200 dark:border-zinc-800">
                Review Methodology
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Right Pane - Visual/Data */}
        <div className="hidden lg:flex flex-col justify-center items-center bg-zinc-50 dark:bg-zinc-900/50 border-l border-zinc-100 dark:border-zinc-800 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <div className="grid grid-cols-12 h-full w-full">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="border-r border-zinc-900 dark:border-white h-full" />
              ))}
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative z-10 w-full max-w-lg p-12"
          >
            <div className="ui-card p-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900 dark:bg-white" />
              <div className="flex justify-between items-center mb-12">
                <div>
                  <p className="ui-label mb-1">System.Status</p>
                  <p className="font-serif italic text-xl dark:text-white">Ready for Analysis</p>
                </div>
                <div className="w-12 h-12 rounded-full border border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-white animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      <span>Metric_0{i + 1}</span>
                      <span>{85 + i * 5}%</span>
                    </div>
                    <div className="h-1 bg-zinc-100 dark:bg-zinc-800 w-full">
                      <div className="h-full bg-zinc-900 dark:bg-white" style={{ width: `${85 + i * 5}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 pt-12 border-t border-zinc-50 dark:border-zinc-800 flex justify-between items-end">
                <div className="text-[8px] font-mono uppercase tracking-[0.3em] text-zinc-300 dark:text-zinc-600">
                  CareerPath.Intelligence.v4.0
                </div>
                <div className="w-8 h-8 border border-zinc-100 dark:border-zinc-800 rotate-45" />
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="px-12 py-8 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center relative z-20 bg-white dark:bg-zinc-950">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          © 2026 CareerPath AI. All Rights Reserved.
        </div>
        <div className="flex gap-8 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          <button className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy</button>
          <button className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</button>
          <button className="hover:text-zinc-900 dark:hover:text-white transition-colors">Contact</button>
        </div>
      </footer>
    </div>
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | undefined;
    
    if ('files' in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
      setIsDragging(false);
    }

    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        setResumeText(fullText);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setResumeText(result.value);
      } else {
        const text = await file.text();
        setResumeText(text);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read file. Please try pasting the text instead.');
    } finally {
      setLoading(false);
    }
  };

  const renderOnboarding = () => {
    const steps = [
      { id: 1, title: 'Objective Definition', icon: Target },
      { id: 2, title: 'Experience Ingestion', icon: Upload },
      { id: 3, title: 'Skill Refinement', icon: BrainCircuit },
      { id: 4, title: 'Strategic Parameters', icon: Activity },
    ];

    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 p-6 md:p-12 flex flex-col items-center transition-colors duration-300">
        {/* Progress Indicator */}
        <div className="max-w-4xl w-full mb-12">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-px bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 z-0" />
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = onboardingStep === step.id;
              const isCompleted = onboardingStep > step.id;
              
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                  <div className={`w-10 h-10 flex items-center justify-center transition-all duration-500 ${
                    isActive ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 scale-110 shadow-lg' :
                    isCompleted ? 'bg-emerald-500 text-white' :
                    'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-[9px] font-mono uppercase tracking-widest hidden md:block ${
                    isActive ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-400 dark:text-zinc-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <motion.div 
          key={onboardingStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl w-full"
        >
          <Card className="p-12 ui-card">
            {onboardingStep === 1 && (
              <div className="space-y-12">
                <div className="text-center">
                  <div className="ui-label mb-4">Phase_01</div>
                  <h2 className="text-4xl font-serif italic text-zinc-900 dark:text-white mb-4">Objective Definition</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 font-light">Define the current state and target destination of your professional journey.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="ui-label">Current Designation</label>
                    <input
                      type="text"
                      className="w-full p-4 rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white outline-none transition-all text-base"
                      placeholder="e.g. Senior Analyst"
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="ui-label">Target Objective</label>
                    <input
                      type="text"
                      className="w-full p-4 rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white outline-none transition-all text-base"
                      placeholder="e.g. Product Director"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex gap-4">
                    <Info className="w-5 h-5 text-zinc-400 shrink-0" />
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      <p className="font-bold text-zinc-900 dark:text-white mb-1 uppercase tracking-widest">How it works</p>
                      Your current and target roles help our AI understand the gap in your professional profile and suggest the most efficient transition roadmap.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="space-y-12">
                <div className="text-center">
                  <div className="ui-label mb-4">Phase_02</div>
                  <h2 className="text-4xl font-serif italic text-zinc-900 dark:text-white mb-4">Experience Ingestion</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 font-light">Upload your professional credentials for deep skill extraction.</p>
                </div>

                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); handleFileUpload(e); }}
                  className={`relative border-2 border-dashed p-16 flex flex-col items-center justify-center gap-6 transition-all duration-500 group ${
                    isDragging || fileName ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-900/50' : 
                    'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                  } rounded-none`}
                >
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    accept=".pdf,.txt,.docx"
                    onChange={handleFileUpload}
                  />
                  <div className={`transition-all duration-300 ${
                    loading ? 'text-zinc-400 dark:text-zinc-500 animate-pulse' :
                    fileName ? 'text-zinc-900 dark:text-white' : 
                    'text-zinc-300 dark:text-zinc-700'
                  }`}>
                    {loading ? <Clock className="w-8 h-8 animate-spin" /> : 
                     fileName ? <FileText className="w-8 h-8" /> : 
                     <Upload className="w-8 h-8" />}
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-zinc-900 dark:text-white">
                      {loading ? 'Processing_Data' : fileName ? fileName : 'Upload_Professional_Credentials'}
                    </p>
                    <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-3 uppercase tracking-widest">
                      {loading ? 'Extracting_Content' : fileName ? 'Verification_Complete' : 'PDF / TXT / DOCX / MAX 10MB'}
                    </p>
                  </div>
                  {fileName && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFileName(null); setResumeText(''); }}
                      className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-100 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-[9px] font-mono uppercase tracking-[0.4em]">
                    <span className="bg-white dark:bg-zinc-900 px-6 text-zinc-400 dark:text-zinc-500">OR_MANUAL_ENTRY</span>
                  </div>
                </div>

                <textarea
                  className="w-full h-48 p-6 rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white outline-none transition-all font-mono text-sm resize-none leading-relaxed"
                  placeholder="Paste your professional history, key achievements, or strategic milestones here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="space-y-12">
                <div className="text-center">
                  <div className="ui-label mb-4">Phase_03</div>
                  <h2 className="text-4xl font-serif italic text-zinc-900 dark:text-white mb-4">Skill Refinement</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 font-light">Review and refine the skills extracted from your profile.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {skills.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 group">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{skill.name}</p>
                        <div className="flex gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-2 h-1 ${i < skill.level ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                        className="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const name = prompt('Enter skill name:');
                      if (name) setSkills([...skills, { name, level: 3, source: 'manual' }]);
                    }}
                    className="flex items-center justify-center gap-2 p-4 border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-xs font-mono uppercase tracking-widest">Add_Skill</span>
                  </button>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex gap-4">
                    <Info className="w-5 h-5 text-zinc-400 shrink-0" />
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      <p className="font-bold text-zinc-900 dark:text-white mb-1 uppercase tracking-widest">Verification Protocol</p>
                      Our AI has extracted these skills from your profile. Please verify their accuracy. You can remove irrelevant skills or manually add missing ones to ensure the most accurate career mapping.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {onboardingStep === 4 && (
              <div className="space-y-12">
                <div className="text-center">
                  <div className="ui-label mb-4">Phase_04</div>
                  <h2 className="text-4xl font-serif italic text-zinc-900 dark:text-white mb-4">Strategic Parameters</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 font-light">Define the temporal horizon and additional context for your transition.</p>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="ui-label">Temporal Horizon</label>
                    <div className="relative">
                      <select
                        className="w-full p-4 rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white outline-none transition-all text-base appearance-none cursor-pointer"
                        value={transitionDuration}
                        onChange={(e) => setTransitionDuration(e.target.value)}
                      >
                        <option value="3 months">Quarterly (3 Months)</option>
                        <option value="6 months">Semi-Annual (6 Months)</option>
                        <option value="12 months">Annual (12 Months)</option>
                        <option value="Flexible">Strategic / Open-ended</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-zinc-500">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="ui-label">Additional Strategic Context</label>
                    <textarea
                      className="w-full h-40 p-4 rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white outline-none transition-all text-base resize-none leading-relaxed"
                      placeholder="Specify industry preferences, geographic constraints, or specific technological interests."
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-16 pt-10 border-t border-zinc-50 dark:border-zinc-800">
              <Button variant="ghost" onClick={handleOnboardingBack} className="ui-label">
                {onboardingStep === 1 ? 'Abort' : 'Back'}
              </Button>
              <Button 
                loading={loading} 
                onClick={handleOnboardingNext} 
                disabled={(onboardingStep === 1 && (!currentRole || !targetRole)) || (onboardingStep === 2 && !resumeText)} 
                className="rounded-none h-14 px-12"
              >
                {onboardingStep === 4 ? 'Generate.Analysis' : 'Continue'}
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 p-6 md:p-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 dark:bg-white flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-white dark:text-zinc-900" />
            </div>
            <span className="font-serif italic text-2xl tracking-tight text-zinc-900 dark:text-white">CareerPath AI</span>
          </div>
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white">
              Log Out
            </Button>
          </div>
        </div>

        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-8">
          <div>
            <div className="ui-label mb-6">System.Dashboard</div>
            <h2 className="text-6xl ui-heading mb-4">Professional Inventory</h2>
            <p className="text-zinc-500 dark:text-zinc-400 font-light text-xl">Validated skill matrix and strategic alignment.</p>
          </div>
          <div className="flex gap-6">
            <Button onClick={handleStartAssessment} loading={isAssessmentLoading} variant="outline" className="rounded-none h-14 px-8 border-zinc-200 dark:border-zinc-800">
              <BrainCircuit className="w-5 h-5 mr-3" /> Validate.Skills
            </Button>
            <Button onClick={() => setView('onboarding')} className="rounded-none h-14 px-8">
              <Plus className="w-5 h-5 mr-3" /> Update.Profile
            </Button>
          </div>
        </header>

        {/* Feasibility Analysis Section */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-6">
            <div className="ui-header mb-0">Transition_Feasibility.Index</div>
            <Tooltip content="Calculated based on skill overlap, market demand, and learning curve.">
              <div className="flex items-center gap-2 cursor-help">
                <span className="ui-label !text-[10px] text-zinc-400 dark:text-zinc-500">AI_Confidence: High</span>
                <Info className="w-4 h-4 text-zinc-300 dark:text-zinc-700 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors" />
              </div>
            </Tooltip>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <Card className="lg:col-span-1 p-12 flex flex-col items-center justify-center relative overflow-hidden group cursor-default ui-card">
              <div className="absolute top-4 left-4 text-[8px] font-mono text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.3em]">
                Metric: Alignment_Score
              </div>
              
              {/* Radial Gauge with Hover Interaction */}
              <div className="relative w-56 h-56 flex items-center justify-center group/gauge">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="112"
                    cy="112"
                    r="100"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="transparent"
                    className="text-zinc-100 dark:text-zinc-800"
                  />
                  <motion.circle
                    cx="112"
                    cy="112"
                    r="100"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={628.3}
                    initial={{ strokeDashoffset: 628.3 }}
                    animate={{ strokeDashoffset: 628.3 - (628.3 * (recommendations.find(r => r.isTarget)?.overlapScore || 0)) / 100 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="text-zinc-900 dark:text-white"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform duration-500 group-hover/gauge:scale-110">
                  <span className="text-6xl font-serif italic text-zinc-900 dark:text-white">
                    {recommendations.find(r => r.isTarget)?.overlapScore || 0}%
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <Activity className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Feasibility</span>
                  </div>
                </div>
                
                {/* Decorative elements for hardware feel */}
                <div className="absolute inset-0 border border-zinc-100/50 dark:border-zinc-800/50 rounded-full scale-110 pointer-events-none" />
                <div className="absolute inset-0 border border-dashed border-zinc-100/30 dark:border-zinc-800/30 rounded-full scale-125 pointer-events-none" />
              </div>
              
              <div className="mt-10 text-center">
                <Tooltip content="Difficulty level determined by AI analysis of skill gaps.">
                  <div className={`inline-flex items-center px-4 py-2 rounded-none text-[11px] font-mono uppercase tracking-[0.2em] border transition-all duration-300 ${
                    (recommendations.find(r => r.isTarget)?.overlapScore || 0) > 70 ? 'bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                    (recommendations.find(r => r.isTarget)?.overlapScore || 0) > 40 ? 'bg-amber-50/50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                    'bg-rose-50/50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                  }`}>
                    Status: {recommendations.find(r => r.isTarget)?.difficulty || 'Analyzing'}
                  </div>
                </Tooltip>
              </div>
            </Card>

            <Card className="lg:col-span-2 p-12 relative overflow-hidden ui-card">
              <div className="absolute top-4 left-4 text-[8px] font-mono text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.3em]">
                Analysis: Strategic_Alignment
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <div className="w-1 h-1 bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-1 h-1 bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-1 h-1 bg-zinc-900 dark:bg-white animate-pulse" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 h-full mt-4">
                <div className="space-y-10">
                  <div className="flex items-start gap-6 group">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 transition-colors group-hover:border-zinc-900 dark:group-hover:border-white">
                      <Target className="w-6 h-6 text-zinc-900 dark:text-white" />
                    </div>
                    <div>
                      <p className="ui-label mb-2">Target Role</p>
                      <p className="text-xl font-serif italic text-zinc-900 dark:text-white leading-tight">{targetRole || 'Not Specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-6 group">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 transition-colors group-hover:border-zinc-900 dark:group-hover:border-white">
                      <TrendingUp className="w-6 h-6 text-zinc-900 dark:text-white" />
                    </div>
                    <div>
                      <p className="ui-label mb-2">Growth Potential</p>
                      <div className="flex items-center gap-3">
                        <p className="text-xl font-serif italic text-zinc-900 dark:text-white leading-tight">High Velocity</p>
                        <Tooltip content="Market demand for this role is increasing by 12% annually.">
                          <Info className="w-3 h-3 text-zinc-300 dark:text-zinc-700 cursor-help" />
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between">
                  <div className="relative">
                    <div className="absolute -left-6 top-0 bottom-0 w-px bg-zinc-100 dark:bg-zinc-800" />
                    <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed italic font-light">
                      "The transition from <span className="text-zinc-900 dark:text-white font-medium">{currentRole}</span> to <span className="text-zinc-900 dark:text-white font-medium">{targetRole}</span> shows a <span className="text-zinc-900 dark:text-white font-medium">{recommendations.find(r => r.isTarget)?.overlapScore || 0}%</span> skill overlap. Strategic focus on <span className="text-zinc-900 dark:text-white font-medium">{recommendations.find(r => r.isTarget)?.missingSkills?.slice(0, 2).join(' and ') || 'core competencies'}</span> will accelerate alignment."
                    </p>
                  </div>
                  <div className="mt-10 pt-8 border-t border-zinc-50 dark:border-zinc-800">
                    <Button 
                      variant="ghost" 
                      onClick={() => setView('recommendations')} 
                      className="p-0 h-auto ui-label hover:bg-transparent text-zinc-900 dark:text-white group flex items-center"
                    >
                      <span>Execute.Full_Analysis</span>
                      <div className="ml-4 w-8 h-px bg-zinc-900 dark:bg-white transition-all duration-300 group-hover:w-12" />
                      <ChevronRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Coaching Section */}
          <div className="lg:col-span-12">
            <div className="flex items-center justify-between mb-6">
              <div className="ui-header mb-0">Strategic_Coaching.Intelligence</div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => generateCoachingTips(currentRole, targetRole, skills)}
                disabled={isCoachingLoading}
                className="ui-label text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                {isCoachingLoading ? 'Regenerating...' : 'Refresh.Insights'}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isCoachingLoading ? (
                [...Array(4)].map((_, i) => (
                  <Card key={i} className="p-8 ui-card animate-pulse">
                    <div className="h-4 bg-zinc-100 dark:bg-zinc-800 w-3/4 mb-4" />
                    <div className="h-4 bg-zinc-100 dark:bg-zinc-800 w-1/2" />
                  </Card>
                ))
              ) : (
                coachingTips.map((tip, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="p-8 h-full ui-card group hover:border-zinc-900 dark:hover:border-white transition-all duration-500">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-none border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-zinc-900 dark:group-hover:bg-white transition-colors duration-500">
                          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 group-hover:text-white dark:group-hover:text-zinc-900">0{i + 1}</span>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-light italic">
                          "{tip}"
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Skill Radar - Recipe 3 Hardware feel refined */}
          <Card className="lg:col-span-7 border-none shadow-none bg-transparent overflow-visible">
            <div className="p-0">
              <div className="ui-header">Skill_Matrix.Visualization</div>
              <div className="h-[450px] w-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-8 relative">
                <div className="absolute top-4 left-4 text-[8px] font-mono text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.3em]">
                  Analysis_Mode: Active
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skills}>
                    <PolarGrid stroke={theme === 'dark' ? '#27272a' : '#f4f4f5'} strokeDasharray="4 4" />
                    <PolarAngleAxis 
                      dataKey="name" 
                      tick={{ fill: theme === 'dark' ? '#71717a' : '#a1a1aa', fontSize: 10, fontWeight: 400, letterSpacing: '0.05em' }} 
                    />
                    <Radar
                      name="Skills"
                      dataKey="level"
                      stroke={theme === 'dark' ? '#fafafa' : '#18181b'}
                      fill={theme === 'dark' ? '#fafafa' : '#18181b'}
                      fillOpacity={0.05}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Skill List - Recipe 1 Data Grid refined */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="ui-header">Inventory.Detailed_Breakdown</div>
            <div className="flex-1 space-y-1">
              {skills.map((skill, i) => (
                <div key={i} className="ui-row px-4 group">
                  <div className="w-12 text-[10px] font-mono text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                    0{i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{skill.name}</p>
                    <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{skill.source}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {[...Array(5)].map((_, j) => (
                      <div 
                        key={j} 
                        className={`w-1 h-3 ${j < skill.level ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-100 dark:bg-zinc-800'}`} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12">
              <Button onClick={() => setView('recommendations')} className="w-full rounded-none h-16 text-lg tracking-tight ui-btn">
                Strategic.Transitions <ArrowRight className="ml-3 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecommendations = () => {
    const targetRec = recommendations.find(r => r.isTarget);
    const otherRecs = recommendations.filter(r => !r.isTarget);

    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 p-8 md:p-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <Button variant="ghost" onClick={() => setView('dashboard')} className="-ml-4 ui-label dark:text-zinc-400 dark:hover:text-white">
              <ChevronRight className="w-4 h-4 rotate-180 mr-2" /> Back to Dashboard
            </Button>
            <div className="flex items-center gap-6">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="ui-label hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white">
                Terminate Session
              </Button>
            </div>
          </div>
          
          <header className="mb-20">
            <div className="ui-label mb-6">System.Intelligence</div>
            <h2 className="text-6xl ui-heading mb-4">Strategic Transitions</h2>
            <p className="text-zinc-500 dark:text-zinc-400 font-light text-xl">Calculated professional paths based on validated skill overlap.</p>
          </header>

          {targetRec && (
            <section className="mb-24">
              <div className="ui-label mb-12 text-center flex items-center justify-center gap-6">
                <div className="w-12 h-px bg-zinc-200 dark:bg-zinc-800" />
                Primary Strategic Objective
                <div className="w-12 h-px bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="ui-card p-12 relative overflow-hidden border-zinc-900 dark:border-white border-2">
                    <div className="absolute top-0 right-0 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-2 ui-label !text-white dark:!text-zinc-900">
                      Target.Role
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                      <div className="md:col-span-4 space-y-8">
                        <div className="w-24 h-24 bg-zinc-900 dark:bg-white flex items-center justify-center">
                          <Target className="w-12 h-12 text-white dark:text-zinc-900" />
                        </div>
                        <div>
                          <p className="ui-label mb-2">Alignment_Score</p>
                          <div className="text-5xl font-serif italic text-zinc-900 dark:text-white">{targetRec.overlapScore}%</div>
                        </div>
                        <div>
                          <p className="ui-label mb-2">Complexity_Index</p>
                          <div className="inline-flex px-4 py-1 border border-zinc-900 dark:border-white text-[10px] font-mono uppercase tracking-widest text-zinc-900 dark:text-white">
                            {targetRec.difficulty}
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-8">
                        <h3 className="text-5xl ui-heading mb-6">{targetRec.role}</h3>
                        <p className="text-xl text-zinc-500 dark:text-zinc-400 mb-10 font-light leading-relaxed italic">
                          "{targetRec.reasoning}"
                        </p>
                        
                        <div className="mb-12">
                          <p className="ui-label mb-6">Strategic_Skill_Gaps</p>
                          <div className="grid grid-cols-2 gap-4">
                            {targetRec.missingSkills.map((s, j) => (
                              <div key={j} className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                <div className="w-1.5 h-1.5 bg-zinc-900 dark:bg-white" />
                                <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button className="w-full h-16 rounded-none text-sm ui-btn" variant="primary" onClick={() => generateRoadmap(targetRec)} loading={loading && selectedRole?.role === targetRec.role}>
                          Initialize Strategic Roadmap
                          <ArrowRight className="ml-3 w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </section>
          )}

          {otherRecs.length > 0 && (
            <section>
              <div className="ui-label mb-12 text-center flex items-center justify-center gap-6">
                <div className="w-12 h-px bg-zinc-200 dark:bg-zinc-800" />
                Alternative Trajectories
                <div className="w-12 h-px bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {otherRecs.map((rec, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="ui-card p-8 h-full flex flex-col hover:border-zinc-900 dark:hover:border-white transition-all duration-300 group">
                      <div className="flex justify-between items-start mb-8">
                        <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 group-hover:bg-zinc-900 dark:group-hover:bg-white transition-colors duration-300">
                          <Briefcase className="w-5 h-5 text-zinc-400 dark:text-zinc-500 group-hover:text-white dark:group-hover:text-zinc-900 transition-colors duration-300" />
                        </div>
                        <div className="ui-label !text-[9px] dark:text-zinc-500">
                          {rec.difficulty}
                        </div>
                      </div>
                      <h3 className="text-2xl ui-heading mb-4">{rec.role}</h3>
                      <div className="flex items-center gap-3 mb-8">
                        <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800">
                          <div className="h-full bg-zinc-900 dark:bg-white" style={{ width: `${rec.overlapScore}%` }} />
                        </div>
                        <span className="ui-label !text-[9px] dark:text-zinc-500">{rec.overlapScore}%</span>
                      </div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10 flex-grow font-light leading-relaxed italic">"{rec.reasoning}"</p>
                      
                      <div className="mb-10">
                        <p className="ui-label !text-[9px] mb-4">Critical Gaps</p>
                        <div className="flex flex-wrap gap-2">
                          {rec.missingSkills.map((s, j) => (
                            <span key={j} className="px-3 py-1 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-[9px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Button className="w-full h-12 rounded-none ui-btn" variant="outline" onClick={() => generateRoadmap(rec)} loading={loading && selectedRole?.role === rec.role}>
                        Explore Path
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  };

  const renderRoadmap = () => (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 p-8 md:p-16 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <Button variant="ghost" onClick={() => setView('recommendations')} className="-ml-4 ui-label dark:text-zinc-400 dark:hover:text-white">
            <ChevronRight className="w-4 h-4 rotate-180 mr-2" /> Back to Recommendations
          </Button>
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="ui-label hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white">
              Terminate Session
            </Button>
          </div>
        </div>
        
        <header className="mb-20">
          <div className="flex justify-between items-start mb-6">
            <div className="ui-label">System.Roadmap</div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadAsPDF} 
                disabled={isExporting !== null}
                className="rounded-none h-10 px-4 border-zinc-200 dark:border-zinc-800 text-[10px] font-mono uppercase tracking-widest"
              >
                {isExporting === 'pdf' ? 'Exporting...' : <><FileDown className="w-3 h-3 mr-2" /> PDF</>}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadAsWord} 
                disabled={isExporting !== null}
                className="rounded-none h-10 px-4 border-zinc-200 dark:border-zinc-800 text-[10px] font-mono uppercase tracking-widest"
              >
                {isExporting === 'word' ? 'Exporting...' : <><FileDown className="w-3 h-3 mr-2" /> Word</>}
              </Button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
            <div className="flex items-center gap-6">
              <h2 className="text-6xl ui-heading tracking-tight">Adaptive Path: {selectedRole?.role}</h2>
              <div className="px-4 py-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-mono uppercase tracking-widest">
                Verified.Protocol
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="ui-label !text-[10px] dark:text-zinc-500">Mission_Progress: {Math.round((roadmap.filter(s => s.completed).length / roadmap.length) * 100)}%</div>
              <div className="w-48 h-1 bg-zinc-100 dark:bg-zinc-800">
                <motion.div 
                  className="h-full bg-zinc-900 dark:bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${(roadmap.filter(s => s.completed).length / roadmap.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 font-light text-xl">A structured learning journey to bridge your strategic skill gaps.</p>
        </header>

        <div className="space-y-12 relative">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800 z-0" />
          
          <AnimatePresence>
            {showReinforcement && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-4 shadow-2xl flex items-center gap-4 border border-zinc-800 dark:border-zinc-200"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold">
                  {reinforcementMessage}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {roadmap.map((step, i) => (
            <motion.div 
              key={i} 
              className="relative z-10 flex gap-8"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`w-16 h-16 flex items-center justify-center shrink-0 shadow-sm border transition-colors duration-500 ${step.completed ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700' : 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white'}`}>
                <span className={`font-mono font-bold text-lg ${step.completed ? 'text-zinc-400 dark:text-zinc-500' : 'text-white dark:text-zinc-900'}`}>{i + 1}</span>
              </div>
              <Card className={`ui-card p-10 flex-1 transition-all duration-500 ${step.completed ? 'opacity-60 bg-zinc-50 dark:bg-zinc-900/50' : ''}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => toggleStepCompletion(i)}
                      className={`w-10 h-10 flex items-center justify-center border transition-all duration-300 ${step.completed ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900' : 'border-zinc-200 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700 hover:border-zinc-900 dark:hover:border-white'}`}
                    >
                      <CheckCircle2 className={`w-6 h-6 transition-opacity duration-300 ${step.completed ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
                    <h4 className={`text-2xl ui-heading transition-all duration-500 ${step.completed ? 'line-through text-zinc-400 dark:text-zinc-600' : ''}`}>{step.title}</h4>
                  </div>
                  <div className="flex items-center ui-label !text-[10px] dark:text-zinc-500">
                    <Clock className="w-4 h-4 mr-2" />
                    {step.estimatedTime}
                  </div>
                </div>
                <p className={`text-lg text-zinc-500 dark:text-zinc-400 mb-10 font-light leading-relaxed transition-all duration-500 ${step.completed ? 'line-through opacity-50' : ''}`}>{step.description}</p>
                
                <div className={`bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-8 transition-opacity duration-500 ${step.completed ? 'opacity-50' : 'opacity-100'}`}>
                  <p className="ui-label mb-6">Recommended Intelligence Resources</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {step.resources.map((res, j) => (
                      <div 
                        key={j} 
                        className="relative flex items-center justify-between text-sm font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 p-4 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-white transition-all duration-300 group cursor-pointer"
                        onMouseEnter={() => setHoveredResource({ stepIndex: i, resIndex: j })}
                        onMouseLeave={() => setHoveredResource(null)}
                      >
                        <span className="truncate mr-4">{res}</span>
                        <ExternalLink className="w-4 h-4 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                        
                        <AnimatePresence>
                          {hoveredResource?.stepIndex === i && hoveredResource?.resIndex === j && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute bottom-full left-0 mb-2 z-50 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-3 text-[10px] font-mono shadow-xl border border-zinc-800 dark:border-zinc-200 whitespace-nowrap pointer-events-none"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                                <span>URL: https://intelligence.careerpath.ai/resource/{res.toLowerCase().replace(/\s+/g, '-')}</span>
                              </div>
                              <div className="absolute top-full left-4 w-2 h-2 bg-zinc-900 dark:bg-white border-r border-b border-zinc-800 dark:border-zinc-200 rotate-45 -translate-y-1" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

          <div className="flex flex-col sm:flex-row justify-center gap-6 pt-16">
            <Button 
              size="lg" 
              variant="primary" 
              className="rounded-none h-16 px-12 ui-btn" 
              onClick={downloadAsPDF}
              disabled={isExporting !== null}
            >
              {isExporting === 'pdf' ? 'Exporting PDF...' : <><FileText className="w-5 h-5 mr-3" /> Export Protocol (PDF)</>}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="rounded-none h-16 px-12 border-zinc-200 dark:border-zinc-800 ui-btn" 
              onClick={downloadAsWord}
              disabled={isExporting !== null}
            >
              {isExporting === 'word' ? 'Exporting Word...' : <><Download className="w-5 h-5 mr-3" /> Export Protocol (Word)</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-sans selection:bg-black selection:text-white min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <AnimatePresence mode="wait">
        {view === 'login' && renderLogin()}
        {view === 'landing' && renderLanding()}
        {view === 'onboarding' && renderOnboarding()}
        {view === 'dashboard' && renderDashboard()}
        {view === 'recommendations' && renderRecommendations()}
        {view === 'roadmap' && renderRoadmap()}
        {view === 'assessment' && (
          <div className="min-h-screen bg-white dark:bg-zinc-950 p-6 flex items-center justify-center transition-colors duration-300">
            <Assessment 
              questions={assessmentQuestions} 
              onComplete={handleAssessmentComplete}
              onCancel={() => setView('dashboard')}
            />
          </div>
        )}
      </AnimatePresence>

      {/* AI Powered Chatbot */}
      {isLoggedIn && (
        <Chatbot 
          context={`User is a ${currentRole} looking to transition to ${targetRole}. Their current skills are: ${skills.map(s => s.name).join(', ')}.`} 
        />
      )}

      {renderTutorial()}
    </div>
  );
}
