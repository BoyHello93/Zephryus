
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Course, Lesson, Difficulty, CourseLength, Badge } from '../types';

// Initialize the client. API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const courseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    finalOutcomeDescription: { type: Type.STRING, description: "A vivid description of the final project the user will have built by the end." },
    modules: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          lessons: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                concept: { type: Type.STRING },
                instructions: { type: Type.STRING },
                initialCode: { type: Type.STRING },
                solutionCode: { type: Type.STRING },
              },
              required: ['id', 'title', 'description', 'concept', 'instructions', 'initialCode', 'solutionCode']
            }
          }
        },
        required: ['id', 'title', 'description', 'lessons']
      }
    }
  },
  required: ['title', 'description', 'finalOutcomeDescription', 'modules']
};

export const generateCourse = async (userPrompt: string, difficulty: Difficulty, length: CourseLength): Promise<Course> => {
  try {
    let difficultyPrompt = "";
    
    if (difficulty === 'novice') {
        difficultyPrompt = `
        DIFFICULTY: NOVICE (Absolute Beginner).
        1. 'initialCode': MUST be EMPTY (or just <body></body>).
        2. 'instructions': MUST TELL THE USER EXACTLY WHAT TO TYPE, VERBATIM.
           - Format: "Type the following code inside the body tag: \n <div class='card'></div>"
           - THEN explain *why* they typed it.
           - Do NOT give abstract tasks like "Create a container". 
           - Give them the code, ask them to type it.
        3. 'concept': Explain the specific syntax used in this step simply.
        4. Progression: Very slow, small steps.
        `;
    } else if (difficulty === 'beginner') {
      difficultyPrompt = `
      DIFFICULTY: BEGINNER (Guided but Hands-on).
      1. 'initialCode': MUST be EMPTY (or minimal).
      2. 'instructions': Give explicit tasks but do NOT write the exact code unless it's complex.
         - Say: "Create an <h1> tag with the text 'Welcome'." (Do not show the <h1> tag itself unless necessary).
         - Encourage them to remember syntax.
      3. 'concept': Explain the specific tag/style.
      `;
    } else if (difficulty === 'intermediate') {
      difficultyPrompt = `
      DIFFICULTY: INTERMEDIATE. 
      1. 'initialCode': Empty file.
      2. 'instructions': Give clear requirements (e.g., "Create a flex container") but do NOT provide exact syntax.
      3. Focus on logic and CSS layout.
      `;
    } else {
      difficultyPrompt = `
      DIFFICULTY: ADVANCED. 
      1. 'initialCode': Empty file.
      2. 'instructions': Provide high-level technical specifications only.
      3. Focus on performance, best practices, and complex logic.
      `;
    }

    let lengthPrompt = "";
    if (length === 'short') {
        lengthPrompt = "Create a 'Crash Course'. Total of 3-4 lessons. Focus on getting a quick result.";
    } else if (length === 'medium') {
        lengthPrompt = "Create a standard course. Total of 6-8 lessons across 2-3 modules. Balanced depth.";
    } else {
        lengthPrompt = "Create a 'Deep Dive' course. Total of 10-15 lessons. Go INDEPTH. The final result must be a high-quality, portfolio-ready application, not a toy app. Include styling, interactivity, and edge cases.";
    }

    // 1. Generate Course Structure (Text)
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: `Create a comprehensive, interactive coding course for: "${userPrompt}". 
      The course should rely on HTML/CSS/JS (vanilla) that can run in a browser iframe.
      
      ${lengthPrompt}
      ${difficultyPrompt}

      IMPORTANT: The user wants to write the code themselves. 
      For the FIRST lesson of Module 1, 'initialCode' MUST BE an empty string or extremely minimal (like <html></html>).
      For subsequent lessons, 'initialCode' should normally reflect the state of the code *after* the previous lesson is completed, but WITHOUT the new code for the current lesson (so the user has to add it).
      
      Ensure the 'finalOutcomeDescription' is exciting and describes a polished product.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: courseSchema,
        systemInstruction: "You are Zephyr, an expert technical curriculum designer. You create engaging, hands-on coding courses where users learn by doing, starting from scratch."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    const data = JSON.parse(text) as Course;
    
    // 2. Generate Preview Image (Parallel-ish)
    // We try to generate an image of the final result to show on the map
    let previewImage: string | undefined = undefined;
    try {
        const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ 
                    text: `Generate a photorealistic, high-quality UI screenshot of a modern mobile/web application for: "${data.title}". 
                    Description: ${data.finalOutcomeDescription}. 
                    Style: Modern, sleek, dark mode, vibrant accent colors. No text overlays.` 
                }]
            }
        });
        
        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                previewImage = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }
    } catch (imgError) {
        console.warn("Failed to generate preview image:", imgError);
        // Continue without image
    }

    // Add IDs if missing and initialize state
    const processedCourse: Course = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      previewImage: previewImage,
      modules: data.modules.map((m, i) => ({
        ...m,
        id: m.id || `mod-${i}`,
        lessons: m.lessons.map((l, j) => ({
          ...l,
          id: l.id || `les-${i}-${j}`,
          completed: false,
          // Explicitly ensure initialCode is minimal if the model ignored it, though checking for null/undefined is key
          initialCode: (i === 0 && j === 0 && (!l.initialCode || l.initialCode.length > 50)) ? "" : l.initialCode
        }))
      }))
    };
    
    return processedCourse;
  } catch (error) {
    console.error("Course generation failed:", error);
    throw error;
  }
};

export const checkCode = async (currentCode: string, instructions: string, goal: string): Promise<{ passed: boolean; feedback: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: `Evaluate the following code.
      Goal: "${goal}".
      Instructions given to user: "${instructions}".
      
      User Code:
      \`\`\`html
      ${currentCode}
      \`\`\`
      
      Did the user satisfy the requirements? 
      If they are a beginner/novice, be encouraging but ensure the specific task was done.
      If the code runs and meets the core requirement, mark passed: true.
      
      Return JSON: { "passed": boolean, "feedback": "Short constructive feedback. If failed, hint at what is missing." }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            passed: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING }
          },
          required: ['passed', 'feedback']
        }
      }
    });

    const text = response.text;
    if (!text) return { passed: false, feedback: "Could not verify code." };
    return JSON.parse(text);
  } catch (error) {
    console.error("Code check failed:", error);
    return { passed: false, feedback: "Error checking code. Please try again." };
  }
};

export const chatWithMentor = async (history: {role: string, parts: {text: string}[]}[], newMessage: string, context: string) => {
    const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        history: history,
        config: {
            systemInstruction: `You are a helpful coding mentor named Zephyr. 
            The user is currently working on this lesson context: ${context}.
            Keep answers concise and encouraging. 
            If the user asks about current events, documentation, or libraries, use the googleSearch tool.`,
            tools: [{ googleSearch: {} }] 
        }
    });

    const result = await chat.sendMessage({ message: newMessage });
    
    const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
    let text = result.text || "I couldn't generate a response.";

    if (groundingMetadata?.groundingChunks) {
       const sources = groundingMetadata.groundingChunks
        .map((chunk: any) => chunk.web?.uri)
        .filter((uri: any) => uri)
        .map((uri: any) => `\nSource: ${uri}`)
        .join('');
       if (sources) text += `\n\n${sources}`;
    }

    return text;
};

export const evaluateBadge = async (code: string): Promise<Badge | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this HTML/CSS/JS code written in a playground.
            Code:
            \`\`\`html
            ${code}
            \`\`\`
            
            Does this code demonstrate effort, creativity, or a specific skill? 
            If yes, award a cool, RPG-style badge (e.g., "Flexbox Sorcerer", "DOM Tamer", "Pixel Artist").
            If the code is empty or too simple (just Hello World), return null.

            Return JSON: { "awarded": boolean, "name": "Badge Name", "description": "Why they got it", "icon": "Emoji or Lucide icon name (e.g. Zap, Star, Code, Palette)" }
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        awarded: { type: Type.BOOLEAN },
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        icon: { type: Type.STRING }
                    },
                    required: ['awarded']
                }
            }
        });
        
        const data = JSON.parse(response.text || "{}");
        if (data.awarded) {
            return {
                id: crypto.randomUUID(),
                name: data.name,
                description: data.description,
                icon: data.icon,
                awardedAt: Date.now()
            };
        }
        return null;
    } catch (e) {
        console.error("Badge eval failed", e);
        return null;
    }
}