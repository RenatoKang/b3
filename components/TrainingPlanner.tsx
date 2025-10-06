import React, { useState } from 'react';
import { CurrentUser, SkillLevel } from '../types';
import { SKILL_LEVELS } from '../constants';
import { generateTrainingPlan } from '../services/geminiService';

interface TrainingPlannerProps {
    currentUser: CurrentUser;
}

const FOCUS_AREAS = [
    'Footwork',
    'Smash',
    'Defense',
    'Net Play',
    'Serve',
    'Clear',
    'Drop Shot',
];

const CoachIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
);

export const TrainingPlanner: React.FC<TrainingPlannerProps> = ({ currentUser }) => {
    const [skillLevel, setSkillLevel] = useState<SkillLevel>(currentUser.skillLevel);
    const [focusArea, setFocusArea] = useState<string>(FOCUS_AREAS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [plan, setPlan] = useState<string | null>(null);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setPlan(null);
        
        try {
            const skillLabel = SKILL_LEVELS.find(l => l.value === skillLevel)?.label || skillLevel;
            const generatedPlan = await generateTrainingPlan(skillLabel, focusArea);
            setPlan(generatedPlan);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <CoachIcon className="w-16 h-16 mx-auto text-brand-blue" />
                <h2 className="text-2xl font-bold mt-4 text-brand-blue">AI 배드민턴 코치</h2>
                <p className="text-gray-600 mt-2">개인 맞춤형 훈련 계획을 받아보세요.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="skillLevel" className="block text-sm font-medium text-gray-700">나의 등급</label>
                        <select
                            id="skillLevel"
                            value={skillLevel}
                            onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                        >
                            {SKILL_LEVELS.map(level => (
                                <option key={level.value} value={level.value}>{level.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="focusArea" className="block text-sm font-medium text-gray-700">집중 훈련 분야</label>
                        <select
                            id="focusArea"
                            value={focusArea}
                            onChange={(e) => setFocusArea(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                        >
                            {FOCUS_AREAS.map(area => (
                                <option key={area} value={area}>{area}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="pt-2 text-center">
                     <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full md:w-auto bg-shuttle-yellow text-brand-blue font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
                    >
                        {isLoading ? '생성 중...' : '훈련 계획 생성'}
                    </button>
                </div>
            </form>
            
            {isLoading && (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
                    <p className="text-brand-blue mt-4">AI 코치가 당신을 위한 훈련 계획을 짜고 있습니다...</p>
                </div>
            )}
            
            {error && <p className="text-red-500 text-center">{error}</p>}
            
            {plan && (
                <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="text-xl font-bold mb-4 text-brand-blue">맞춤 훈련 계획</h3>
                    <div className="space-y-4 text-gray-700 whitespace-pre-wrap font-sans">
                        {plan}
                    </div>
                </div>
            )}
        </div>
    );
};
