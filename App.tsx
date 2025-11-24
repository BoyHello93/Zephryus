
import React, { useState, useEffect } from 'react';
import Landing from './components/Landing';
import CourseMap from './components/CourseMap';
import LessonWorkspace from './components/LessonWorkspace';
import Playground from './components/Playground';
import { generateCourse } from './services/geminiService';
import { saveCourseToStorage, saveSettingsToStorage, getSettingsFromStorage, saveBadgeToStorage } from './services/storage';
import { Course, Lesson, ViewState, Difficulty, CourseLength, AppSettings, Badge, Theme } from './types';

const THEME_COLORS: Record<Theme, Record<string, string>> = {
    zephyr: {
        '50': '238 242 255',
        '100': '224 231 255',
        '200': '199 210 254',
        '300': '165 180 252',
        '400': '129 140 248',
        '500': '99 102 241',
        '600': '79 70 229',
        '700': '67 56 202',
        '800': '55 48 163',
        '900': '49 46 129',
    },
    sunset: {
        '50': '255 241 242',
        '100': '255 228 230',
        '200': '254 205 211',
        '300': '253 164 175',
        '400': '251 113 133',
        '500': '244 63 94',
        '600': '225 29 72',
        '700': '190 18 60',
        '800': '159 18 57',
        '900': '136 19 55',
    },
    ocean: {
        '50': '236 254 255',
        '100': '207 250 254',
        '200': '165 243 252',
        '300': '103 232 249',
        '400': '34 211 238',
        '500': '6 182 212',
        '600': '8 145 178',
        '700': '14 116 144',
        '800': '21 94 117',
        '900': '22 78 99',
    },
    forest: {
        '50': '236 253 245',
        '100': '209 250 229',
        '200': '167 243 208',
        '300': '110 231 183',
        '400': '52 211 153',
        '500': '16 185 129',
        '600': '5 150 105',
        '700': '4 120 87',
        '800': '6 95 70',
        '900': '6 78 59',
    },
    crimson: {
        '50': '254 242 242',
        '100': '254 226 226',
        '200': '254 202 202',
        '300': '252 165 165',
        '400': '248 113 113',
        '500': '239 68 68',
        '600': '220 38 38',
        '700': '185 28 28',
        '800': '153 27 27',
        '900': '127 29 29',
    }
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ showTips: true, showInsertionHints: true, theme: 'zephyr' });

  useEffect(() => {
    setSettings(getSettingsFromStorage());
  }, []);

  // Apply Theme
  useEffect(() => {
      const themeColors = THEME_COLORS[settings.theme] || THEME_COLORS.zephyr;
      const root = document.documentElement;
      Object.entries(themeColors).forEach(([shade, value]) => {
          root.style.setProperty(`--primary-${shade}`, value);
      });
  }, [settings.theme]);

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettingsToStorage(newSettings);
  };

  const handleGenerateCourse = async (prompt: string, difficulty: Difficulty, length: CourseLength) => {
    setIsGenerating(true);
    setError(null);
    try {
      const generatedCourse = await generateCourse(prompt, difficulty, length);
      setCourse(generatedCourse);
      // Auto save new course
      saveCourseToStorage(generatedCourse);
      setView('map');
    } catch (err) {
      console.error(err);
      setError("Failed to generate course. Please try a different prompt or check your API configuration.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResumeCourse = (savedCourse: Course) => {
      setCourse(savedCourse);
      setView('map');
  }

  const handleSelectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setView('workspace');
  };

  const handleBackToMap = () => {
    setCurrentLesson(null);
    setView('map');
  };

  const handleCompleteLesson = (lessonId: string, userCode: string) => {
    if (!course) return;

    // Mark lesson as complete in the course data AND save the user's code
    const updatedCourse = {
      ...course,
      modules: course.modules.map(mod => ({
        ...mod,
        lessons: mod.lessons.map(les => 
          les.id === lessonId ? { ...les, completed: true, userCode: userCode } : les
        )
      }))
    };
    
    setCourse(updatedCourse);
    saveCourseToStorage(updatedCourse);
    
    // Logic to find the IMMEDIATE next lesson
    let foundCurrent = false;
    let nextLesson: Lesson | null = null;
    
    for (const mod of updatedCourse.modules) {
        for (const les of mod.lessons) {
            if (foundCurrent) {
                nextLesson = les;
                break;
            }
            if (les.id === lessonId) {
                foundCurrent = true;
            }
        }
        if (nextLesson) break;
    }

    // Automatically transition to the next lesson if it exists
    if (nextLesson) {
        // If the next lesson has existing user code (revisiting), use it, otherwise use initial
        setCurrentLesson(nextLesson);
    } else {
        // Course finished or no next lesson found
        handleBackToMap();
    }
  };

  const handleReset = () => {
    setCourse(null);
    setCurrentLesson(null);
    setView('landing');
  };

  const handleAwardBadge = (badge: Badge) => {
    saveBadgeToStorage(badge);
    // You could add a toast notification here
  }

  return (
    <div className="font-sans antialiased text-slate-900 h-screen overflow-hidden">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold hover:text-red-900">&times;</button>
        </div>
      )}

      {view === 'landing' && (
        <Landing 
            onGenerate={handleGenerateCourse} 
            onResume={handleResumeCourse}
            onEnterPlayground={() => setView('playground')}
            isGenerating={isGenerating} 
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
        />
      )}

      {view === 'playground' && (
          <Playground 
            onBack={handleReset}
            onAwardBadge={handleAwardBadge}
          />
      )}

      {view === 'map' && course && (
        <CourseMap 
          course={course} 
          onSelectLesson={handleSelectLesson}
          onBack={handleReset} 
        />
      )}

      {view === 'workspace' && currentLesson && (
        <LessonWorkspace 
          lesson={currentLesson} 
          onBack={handleBackToMap}
          onComplete={handleCompleteLesson}
          settings={settings}
        />
      )}
    </div>
  );
};

export default App;