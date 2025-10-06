import React, { useState, useMemo } from 'react';
import { Member, SkillLevel, Tournament, Match, GameType, Gender, CurrentUser, Role } from '../types';
import { SKILL_LEVELS } from '../constants';
import { generateBracket } from '../services/geminiService';
import { BracketDisplay } from './BracketDisplay';

interface TournamentGeneratorProps {
    members: Member[];
    tournaments: Record<string, Tournament>;
    onAdd: (tournament: Tournament) => void;
    onUpdate: (updatedTournament: Tournament) => void;
    onDelete: (tournamentId: string) => void;
    currentUser: CurrentUser;
}

type Mode = 'level' | 'combined' | 'gender' | 'mixed';

export const TournamentGenerator: React.FC<TournamentGeneratorProps> = ({ members, tournaments, onAdd, onUpdate, onDelete, currentUser }) => {
    const [mode, setMode] = useState<Mode>('level');
    const [selectedLevel, setSelectedLevel] = useState<SkillLevel>(SkillLevel.MA);
    const [selectedGender, setSelectedGender] = useState<Gender>(Gender.MALE);
    const [mixedLevels, setMixedLevels] = useState<Record<SkillLevel, boolean>>(
        () => SKILL_LEVELS.reduce((acc, level) => ({...acc, [level.value]: false}), {} as Record<SkillLevel, boolean>)
    );
    const [gameType, setGameType] = useState<GameType>(GameType.SINGLES);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);

    const tournamentList = useMemo(() => Object.values(tournaments), [tournaments]);
    const activeTournament = activeTournamentId ? tournaments[activeTournamentId] : null;

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);

        let filteredPlayers: Member[] = [];
        let tournamentName = '';

        switch(mode) {
            case 'level':
                filteredPlayers = members.filter(m => m.skillLevel === selectedLevel);
                tournamentName = SKILL_LEVELS.find(l => l.value === selectedLevel)?.label || selectedLevel;
                break;
            case 'combined':
                filteredPlayers = members;
                tournamentName = '통합';
                break;
            case 'gender':
                filteredPlayers = members.filter(m => m.gender === selectedGender);
                tournamentName = selectedGender === Gender.MALE ? '남자' : '여자';
                break;
            case 'mixed':
                const activeMixedLevels = Object.keys(mixedLevels).filter(k => mixedLevels[k as SkillLevel]) as SkillLevel[];
                if (activeMixedLevels.length === 0) {
                    setError('혼합할 등급을 하나 이상 선택해주세요.');
                    setIsLoading(false);
                    return;
                }
                filteredPlayers = members.filter(m => activeMixedLevels.includes(m.skillLevel));
                tournamentName = `${activeMixedLevels.map(l => l.replace('M','').replace('W','')).join('+')}급 혼합`;
                break;
        }

        tournamentName += gameType === GameType.DOUBLES ? ' 복식' : ' 단식';

        let participants: string[] = [];
        if (gameType === GameType.SINGLES) {
            participants = filteredPlayers.map(p => p.name);
        } else {
            const shuffled = [...filteredPlayers].sort(() => Math.random() - 0.5);
            if (shuffled.length < 2) {
                 setError('복식 경기를 생성하려면 최소 2명의 선수가 필요합니다.');
                 setIsLoading(false);
                 return;
            }
            for (let i = 0; i < Math.floor(shuffled.length / 2) * 2; i += 2) {
                participants.push(`${shuffled[i].name} / ${shuffled[i+1].name}`);
            }
        }
        
        if (participants.length < 2) {
            setError('대진표를 생성하려면 최소 2명의 참가자(팀)가 필요합니다.');
            setIsLoading(false);
            return;
        }

        try {
            const matchesData = await generateBracket(participants);
            const newTournament: Tournament = {
                id: `${tournamentName.replace(' ', '-')}-${new Date().toISOString()}`,
                name: tournamentName,
                type: gameType,
                matches: matchesData.map((match, index) => {
                    const parsePlayer = (p: string | null): string | string[] | null => {
                        if (!p) return null;
                        return gameType === GameType.DOUBLES ? p.split(' / ') : p;
                    };
                    const p1 = parsePlayer(match.player1);
                    const p2 = parsePlayer(match.player2);
                    return {
                        id: `${tournamentName}-R1-${index}`,
                        player1: p1,
                        player2: p2,
                        winner: p2 === null ? p1 : null,
                        round: 1,
                    }
                }),
            };
            onAdd(newTournament);
            setActiveTournamentId(newTournament.id);
        } catch (e) {
            setError('대진표 생성에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUpdateTournament = (updatedTournament: Tournament) => {
        onUpdate(updatedTournament);
    }

    const handleDelete = () => {
        if (activeTournamentId && window.confirm(`'${activeTournament?.name}' 대진표를 삭제하시겠습니까?`)) {
            onDelete(activeTournamentId);
            setActiveTournamentId(null);
        }
    }
    
    const renderModeOptions = () => {
        switch(mode) {
            case 'level':
                return <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value as SkillLevel)} className="p-2 border-gray-300 rounded-md bg-brand-blue text-white focus:ring-brand-secondary">
                    {SKILL_LEVELS.map(l => <option key={l.value} value={l.value} style={{ backgroundColor: '#0077b6', color: 'white' }}>{l.label}</option>)}
                </select>;
            case 'gender':
                return <select value={selectedGender} onChange={e => setSelectedGender(e.target.value as Gender)} className="p-2 border-gray-300 rounded-md bg-brand-blue text-white focus:ring-brand-secondary">
                    <option value={Gender.MALE} style={{ backgroundColor: '#0077b6', color: 'white' }}>남자</option>
                    <option value={Gender.FEMALE} style={{ backgroundColor: '#0077b6', color: 'white' }}>여자</option>
                </select>;
            case 'mixed':
                return <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {SKILL_LEVELS.map(l => (
                        <label key={l.value} className="flex items-center space-x-2">
                            <input type="checkbox" checked={mixedLevels[l.value]} onChange={e => setMixedLevels({...mixedLevels, [l.value]: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"/>
                            <span>{l.label}</span>
                        </label>
                    ))}
                </div>;
            default:
                return null;
        }
    }

    const isAdmin = currentUser.role === Role.ADMIN;

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto space-y-8">
            {isAdmin && (
                <div>
                    <h2 className="text-2xl font-bold mb-4 text-brand-blue">대회 대진표 생성기</h2>
                    <div className="space-y-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Participant Selection */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-700">1. 참가자 선택</h3>
                                <div className="flex flex-col space-y-2">
                                    <label><input type="radio" name="mode" value="level" checked={mode === 'level'} onChange={() => setMode('level')} className="mr-2"/> 등급별</label>
                                    <label><input type="radio" name="mode" value="combined" checked={mode === 'combined'} onChange={() => setMode('combined')} className="mr-2"/> 통합</label>
                                    <label><input type="radio" name="mode" value="gender" checked={mode === 'gender'} onChange={() => setMode('gender')} className="mr-2"/> 성별</label>
                                    <label><input type="radio" name="mode" value="mixed" checked={mode === 'mixed'} onChange={() => setMode('mixed')} className="mr-2"/> 등급 혼합</label>
                                </div>
                                <div className="pl-6">{renderModeOptions()}</div>
                            </div>

                            {/* Game Type Selection */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-700">2. 게임 종류 선택</h3>
                                <div className="flex flex-col space-y-2">
                                    <label><input type="radio" name="gameType" value={GameType.SINGLES} checked={gameType === GameType.SINGLES} onChange={() => setGameType(GameType.SINGLES)} className="mr-2"/> 단식</label>
                                    <label><input type="radio" name="gameType" value={GameType.DOUBLES} checked={gameType === GameType.DOUBLES} onChange={() => setGameType(GameType.DOUBLES)} className="mr-2"/> 복식</label>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 text-center">
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="w-full md:w-auto bg-shuttle-yellow text-brand-blue font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
                            >
                                {isLoading ? '생성 중...' : '대진표 생성'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            
            {isAdmin && <hr />}

            <div>
                 <h2 className="text-2xl font-bold mb-4 text-brand-blue">생성된 대진표</h2>
                 {tournamentList.length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                             <select 
                                value={activeTournamentId ?? ''} 
                                onChange={e => setActiveTournamentId(e.target.value)}
                                className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-brand-blue focus:border-brand-blue"
                            >
                                <option value="" disabled>-- 대진표 선택 --</option>
                                {tournamentList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            {isAdmin && (
                                <button onClick={handleDelete} disabled={!activeTournamentId} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 disabled:bg-gray-300">
                                    삭제
                                </button>
                            )}
                        </div>
                        {activeTournament && <BracketDisplay tournament={activeTournament} onUpdate={handleUpdateTournament} currentUser={currentUser} />}
                    </div>
                 ) : (
                    <div className="text-center py-10">
                        <p className="text-gray-500">생성된 대진표가 없습니다. {isAdmin ? '위 옵션을 선택하여 대진표를 생성해주세요.' : '운영진이 대진표를 생성할 때까지 기다려주세요.'}</p>
                    </div>
                 )}
            </div>
        </div>
    );
};