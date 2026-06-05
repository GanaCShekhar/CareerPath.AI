import { GoogleGenAI, Type } from "@google/genai";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function normalizeApiKey(value: string | undefined | null) {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return "";
  }

  const placeholderValues = new Set([
    "MY_GEMINI_API_KEY",
    "YOUR_GEMINI_API_KEY",
    "CHANGE_ME",
    "REPLACE_ME",
    "MY_OPENROUTER_API_KEY",
    "YOUR_OPENROUTER_API_KEY",
  ]);

  return placeholderValues.has(trimmed.toUpperCase()) ? "" : trimmed;
}

function stripCodeFences(text: string) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

const openRouterApiKey = normalizeApiKey(
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_OPENROUTER_API_KEY) || ""
);

const geminiApiKey = normalizeApiKey(
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : "") ||
    ""
);

const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

async function callOpenRouter(messages: ChatMessage[], systemPrompt?: string) {
  if (!openRouterApiKey) {
    return "";
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openRouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "http://localhost",
      "X-Title": "CareerPath.AI",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages,
      temperature: 0.3,
      max_tokens: 28,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return (data.choices?.[0]?.message?.content || "").trim();
}

export interface Skill {
  name: string;
  level: number;
  source: string;
}

export interface CareerRecommendation {
  role: string;
  overlapScore: number;
  difficulty: string;
  reasoning: string;
  missingSkills: string[];
  isTarget?: boolean;
}

export interface RoadmapStep {
  title: string;
  description: string;
  resources: string[];
  estimatedTime: string;
  completed?: boolean;
}

const commonSkills = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Express",
  "Python",
  "SQL",
  "Git",
  "Communication",
  "Problem Solving",
  "Leadership",
  "Project Management",
];

function estimateFallbackSkills(text: string): Skill[] {
  const lower = text.toLowerCase();
  const found = commonSkills
    .filter((skill) => lower.includes(skill.toLowerCase()))
    .slice(0, 8)
    .map((name) => ({
      name,
      level: 3,
      source: "resume",
    }));

  if (found.length > 0) {
    return found;
  }

  return [
    { name: "Communication", level: 3, source: "resume" },
    { name: "Problem Solving", level: 3, source: "resume" },
    { name: "Collaboration", level: 3, source: "resume" },
  ];
}

function fallbackRecommendations(targetRole: string): CareerRecommendation[] {
  const safeTarget = targetRole || "Target Role";
  return [
    {
      role: safeTarget,
      overlapScore: 78,
      difficulty: "Medium",
      reasoning: "This aligns with your stated transition goal and likely leverages existing transferable strengths.",
      missingSkills: ["Domain depth", "Interview readiness"],
      isTarget: true,
    },
    {
      role: "Business Analyst",
      overlapScore: 72,
      difficulty: "Easy",
      reasoning: "Strong option if you want to leverage communication and structured problem solving.",
      missingSkills: ["Stakeholder mapping", "Requirements documentation"],
      isTarget: false,
    },
    {
      role: "Product Analyst",
      overlapScore: 69,
      difficulty: "Medium",
      reasoning: "Provides a practical bridge into product or strategy-oriented roles.",
      missingSkills: ["Experiment design", "Metrics storytelling"],
      isTarget: false,
    },
    {
      role: "Project Coordinator",
      overlapScore: 67,
      difficulty: "Easy",
      reasoning: "Useful transition path while building deeper specialization for your long-term target role.",
      missingSkills: ["Risk tracking", "Resource planning"],
      isTarget: false,
    },
  ];
}

function fallbackRoadmap(targetRole: string): RoadmapStep[] {
  const safeTarget = targetRole || "your target role";
  return [
    {
      title: "Assess Current Baseline",
      description: `Evaluate your current strengths and identify the top capability gaps for ${safeTarget}.`,
      resources: ["Self-assessment matrix", "Gap analysis template"],
      estimatedTime: "1 week",
    },
    {
      title: "Build Core Fundamentals",
      description: "Focus on high-impact fundamentals required across most roles in this track.",
      resources: ["Structured online course", "Hands-on mini projects"],
      estimatedTime: "4-6 weeks",
    },
    {
      title: "Create Portfolio Proof",
      description: "Ship 1-2 practical projects that demonstrate job-relevant skills and outcomes.",
      resources: ["Portfolio checklist", "Peer review feedback"],
      estimatedTime: "3-4 weeks",
    },
    {
      title: "Interview and Positioning",
      description: "Prepare your narrative, update resume, and practice role-specific interview questions.",
      resources: ["Mock interviews", "STAR story bank"],
      estimatedTime: "2 weeks",
    },
  ];
}

function fallbackAssessment(skills: Skill[]) {
  const focusSkills = skills.length > 0 ? skills.slice(0, 5) : [{ name: "General Problem Solving" } as Skill];
  return focusSkills.map((skill, index) => ({
    question: `Which approach best improves your proficiency in ${skill.name}?`,
    options: [
      "Practice with real-world scenarios",
      "Only read theory without practice",
      "Avoid feedback loops",
      "Skip fundamentals",
    ],
    correctAnswer: "Practice with real-world scenarios",
    skill: skill.name,
    id: `fallback-q-${index + 1}`,
  }));
}

export const geminiService = {
  async extractSkillsFromText(text: string): Promise<Skill[]> {
    if (openRouterApiKey) {
      try {
        const content = await callOpenRouter(
          [
            {
              role: "user",
              content: `Extract professional skills and their estimated proficiency levels (1-5) from the following text: "${text}". Return as a JSON array of objects with "name", "level", and "source" (set source to "resume").`,
            },
          ],
          "You are a career skills extraction engine. Return only valid JSON."
        );
        return JSON.parse(stripCodeFences(content) || "[]");
      } catch (error) {
        console.error("Failed to extract skills via OpenRouter", error);
        return estimateFallbackSkills(text);
      }
    }

    if (!ai) {
      return estimateFallbackSkills(text);
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract professional skills and their estimated proficiency levels (1-5) from the following text: "${text}". Return as a JSON array of objects with "name", "level", and "source" (set source to "resume").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              level: { type: Type.NUMBER },
              source: { type: Type.STRING },
            },
            required: ["name", "level", "source"],
          },
        },
      },
    });

    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse skills", e);
      return [];
    }
  },

  async getCareerRecommendations(
    currentSkills: Skill[], 
    currentRole: string,
    targetRole: string,
    duration: string,
    interests: string
  ): Promise<CareerRecommendation[]> {
    if (openRouterApiKey) {
      const skillsList = currentSkills.map(s => `${s.name} (Level ${s.level})`).join(", ");
      try {
        const content = await callOpenRouter(
          [
            {
              role: "user",
              content: `User is currently a "${currentRole}".
They want to transition to "${targetRole}" within ${duration}.
Their additional interests are: "${interests}".
Their current skills are: [${skillsList}].

Suggest 4 realistic career transitions:
1. The specific target role they mentioned ("${targetRole}").
2. Three other roles that highly overlap with their current skills but might be different from what they explicitly mentioned.

For each role, provide: role name, overlap score (0-100), difficulty (Easy/Medium/Hard), reasoning, a list of missing skills, and a boolean "isTarget" (true only for the first role).
Return only a JSON array.`,
            },
          ],
          "You are a career transition strategist. Return only valid JSON."
        );
        return JSON.parse(stripCodeFences(content) || "[]");
      } catch (error) {
        console.error("Failed to get recommendations via OpenRouter", error);
        return fallbackRecommendations(targetRole);
      }
    }

    if (!ai) {
      return fallbackRecommendations(targetRole);
    }

    const skillsList = currentSkills.map(s => `${s.name} (Level ${s.level})`).join(", ");
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `
        User is currently a "${currentRole}".
        They want to transition to "${targetRole}" within ${duration}.
        Their additional interests are: "${interests}".
        Their current skills are: [${skillsList}].

        Suggest 4 realistic career transitions:
        1. The specific target role they mentioned ("${targetRole}").
        2. Three other roles that highly overlap with their current skills but might be different from what they explicitly mentioned.
        
        For each role, provide: role name, overlap score (0-100), difficulty (Easy/Medium/Hard), reasoning (explaining why it's a good fit or how it relates to their target), a list of missing skills, and a boolean "isTarget" (true only for the first role).
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              role: { type: Type.STRING },
              overlapScore: { type: Type.NUMBER },
              difficulty: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              isTarget: { type: Type.BOOLEAN },
            },
            required: ["role", "overlapScore", "difficulty", "reasoning", "missingSkills", "isTarget"],
          },
        },
      },
    });

    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse recommendations", e);
      return [];
    }
  },

  async generateRoadmap(currentSkills: Skill[], targetRole: string): Promise<RoadmapStep[]> {
    if (openRouterApiKey) {
      const skillsList = currentSkills.map(s => `${s.name} (Level ${s.level})`).join(", ");
      try {
        const content = await callOpenRouter(
          [
            {
              role: "user",
              content: `Create a step-by-step learning roadmap to transition from these current skills: [${skillsList}] to the role of "${targetRole}". Each step should include a title, description, suggested resources, and estimated time. Return only a JSON array.`,
            },
          ],
          "You are a career roadmap generator. Return only valid JSON."
        );
        return JSON.parse(stripCodeFences(content) || "[]");
      } catch (error) {
        console.error("Failed to generate roadmap via OpenRouter", error);
        return fallbackRoadmap(targetRole);
      }
    }

    if (!ai) {
      return fallbackRoadmap(targetRole);
    }

    const skillsList = currentSkills.map(s => `${s.name} (Level ${s.level})`).join(", ");
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Create a step-by-step learning roadmap to transition from these current skills: [${skillsList}] to the role of "${targetRole}". Each step should include a title, description, suggested resources, and estimated time.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              resources: { type: Type.ARRAY, items: { type: Type.STRING } },
              estimatedTime: { type: Type.STRING },
            },
            required: ["title", "description", "resources", "estimatedTime"],
          },
        },
      },
    });

    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse roadmap", e);
      return [];
    }
  },

  async generateAssessment(skills: Skill[]): Promise<any[]> {
    if (openRouterApiKey) {
      const skillsList = skills.map(s => s.name).join(", ");
      try {
        const content = await callOpenRouter(
          [
            {
              role: "user",
              content: `Generate a 5-question multiple-choice assessment to validate the user's proficiency in these skills: [${skillsList}]. For each question, provide: question text, 4 options, the correct answer, and which skill it's testing. Return only a JSON array.`,
            },
          ],
          "You are a skills assessment generator. Return only valid JSON."
        );
        return JSON.parse(stripCodeFences(content) || "[]");
      } catch (error) {
        console.error("Failed to generate assessment via OpenRouter", error);
        return fallbackAssessment(skills);
      }
    }

    if (!ai) {
      return fallbackAssessment(skills);
    }

    const skillsList = skills.map(s => s.name).join(", ");
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Generate a 5-question multiple-choice assessment to validate the user's proficiency in these skills: [${skillsList}]. For each question, provide: question text, 4 options, the correct answer, and which skill it's testing.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              skill: { type: Type.STRING },
            },
            required: ["question", "options", "correctAnswer", "skill"],
          },
        },
      },
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse assessment", e);
      return [];
    }
  },

  async chatWithGemini(message: string, context: string): Promise<string> {
    if (openRouterApiKey) {
      try {
        const content = await callOpenRouter(
          [
            {
              role: "user",
              content: `Context: ${context}\nUser: ${message}`,
            },
          ],
          "You are a career transition expert. Help the user with their career questions based on their profile and skills. Be concise and professional."
        );
        return content || "I'm sorry, I couldn't generate a response.";
      } catch (error) {
        console.error("OpenRouter chat failed", error);
        return "The AI assistant is temporarily unavailable. Please try again.";
      }
    }

    if (!ai) {
      return "AI API key is not configured. Add VITE_OPENROUTER_API_KEY or VITE_GEMINI_API_KEY to .env.local to enable AI chat responses.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Context: ${context}\nUser: ${message}`,
      config: {
        systemInstruction: "You are a career transition expert. Help the user with their career questions based on their profile and skills. Be concise and professional.",
      },
    });
    return response.text || "I'm sorry, I couldn't generate a response.";
  },

  async generateCoachingTips(currentRole: string, targetRole: string, skills: Skill[]): Promise<string[]> {
    if (openRouterApiKey) {
      const skillsList = skills.map(s => s.name).join(", ");
      try {
        const content = await callOpenRouter(
          [
            {
              role: "user",
              content: `User is transitioning from "${currentRole}" to "${targetRole}".
Their current skills are: [${skillsList}].

Provide 4 highly strategic, actionable career coaching tips or pieces of advice for this specific transition.
Focus on:
1. Strategic positioning
2. Networking advice
3. Skill-gap bridging
4. Interview/Narrative strategy

Return as a JSON array of strings.`,
            },
          ],
          "You are a career coach. Return only valid JSON."
        );
        return JSON.parse(stripCodeFences(content) || "[]");
      } catch (error) {
        console.error("Failed to generate coaching tips via OpenRouter", error);
        return [
          "Pick one capability gap and close it with a project that has measurable outcomes.",
          "Expand your network with practitioners in the target role and ask role-specific questions.",
          "Translate your current achievements into language recognized by the target role.",
          "Run weekly interview drills and collect feedback to improve your narrative quickly.",
        ];
      }
    }

    if (!ai) {
      return [
        "Pick one capability gap and close it with a project that has measurable outcomes.",
        "Expand your network with practitioners in the target role and ask role-specific questions.",
        "Translate your current achievements into language recognized by the target role.",
        "Run weekly interview drills and collect feedback to improve your narrative quickly.",
      ];
    }

    const skillsList = skills.map(s => s.name).join(", ");
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `
        User is transitioning from "${currentRole}" to "${targetRole}".
        Their current skills are: [${skillsList}].
        
        Provide 4 highly strategic, actionable career coaching tips or pieces of advice for this specific transition.
        Focus on:
        1. Strategic positioning
        2. Networking advice
        3. Skill-gap bridging
        4. Interview/Narrative strategy
        
        Return as a JSON array of strings.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse coaching tips", e);
      return [];
    }
  }
};
