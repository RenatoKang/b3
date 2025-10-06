
import React, { useState, useMemo, useEffect } from 'react';
import { SkillLevel, GameType, Gender, Role, Club } from '../types.js';
import { SKILL_LEVELS, CLUBS, SUPER_ADMIN_NAME } from '../constants.js';
import { generateBracket } from '../services/geminiService.js';
import { BracketDisplay } from './BracketDisplay.js';

export const TournamentGenerator = ({ members, tournaments, onAdd, onUpdate, onDelete, currentUser }) => {
    const isSuperAdmin = currentUser.name === SUPER_ADMIN_NAME;
    const isAdmin = currentUser.role === Role.ADMIN;

    const [gameType, setGameType] = useState(GameType.DOUBLES);
    const [filterClub, setFilterClub] = useState(isSuperAdmin ? 'all' : currentUser.club);
    const [filterGender, setFilterGender] = useState('all');
    const [filterLevels, setFilterLevels] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTournamentId, setActiveTournamentId] = useState(null);

    const tournamentList = useMemo(() => {
        return Object.values(tournaments).sort((a, b) => b.id.localeCompare(a.id));
    }, [tournaments]);

    useEffect(() => {
        const isTournamentListEmpty = tournamentList.length === 0;
        const isCurrentTournamentValid = activeTournamentId && tournaments[activeTournamentId];

        if (!isCurrentTournamentValid) {
            if (!isTournamentListEmpty) {
                setActiveTournamentId(tournamentList[0].id);
            } else if (activeTournamentId !== null) {
                setActiveTournamentId(null);
            }
        }
    }, [tournamentList, tournaments, activeTournamentId]);

    const activeTournament = activeTournamentId ? tournaments[activeTournamentId] : null;

    const handleLevelCheckboxChange = (level, isChecked) => {
        setFilterLevels(prev => {
            if (isChecked) {
                return [...prev, level].sort();
            } else {
                return prev.filter(l => l !== level);
            }
        });
    };
    
    const generateSingleBracket = async (players, tournamentName, gameType) => {
        let participants = [];
        if (gameType === GameType.SINGLES) {
            participants = players.map(p => p.name);
        } else {
            const shuffled = [...players].sort(() => Math.random() - 0.5);
            for (let i = 0; i < Math.floor(shuffled.length / 2) * 2; i += 2) {
                participants.push(`${shuffled[i].name} / ${shuffled[i+1].name}`);
            }
        }
        
        if (participants.length < 2) {
            return null;
        }

        const matchesData = await generateBracket(participants);
        return {
            id: `${tournamentName.replace(/\s/g, '-')}-${new Date().toISOString()}`,
            name: tournamentName,
            type: gameType,
            matches: matchesData.map((match, index) => {
                const parsePlayer = (p) => {
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
                };
            }),
        };
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        
        if (filterLevels.length === 0) {
            setError('최소 하나 이상의 등급을 선택해야 합니다.');
            setIsLoading(false);
            return;
        }

        let players = members;
        if (isSuperAdmin && filterClub !== 'all') {
            players = players.filter(m => m.club === filterClub);
        }
        if (filterGender !== 'all') {
            players = players.filter(m => m.gender === filterGender);
        }
        players = players.filter(m => filterLevels.includes(m.skillLevel));

        const club = CLUBS.find(c => c.value === filterClub);
        const clubLabel = filterClub === 'all' ? '전체' : (club && club.label);
        const genderLabel = filterGender === 'all' ? '통합' : (filterGender === Gender.MALE ? '남자' : '여자');
        const levelLabel = filterLevels.map(l => l.replace('M', '').replace('W', '')).join('+') + '급';
        const gameLabel = gameType === GameType.DOUBLES ? '복식' : '단식';
        
        const tournamentName = `${clubLabel} ${genderLabel} ${levelLabel} ${gameLabel}`;

        try {
            const newTournament = await generateSingleBracket(players, tournamentName, gameType);
            if (newTournament) {
                onAdd(newTournament);
                setActiveTournamentId(newTournament.id);
            } else {
                setError('대진표를 생성하기에 참가자가 부족합니다 (최소 2명/팀 필요).');
            }
        } catch (e) {
             setError('대진표 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateAllLevels = async () => {
        setIsLoading(true);
        setError(null);

        let basePlayers = members;
        if (isSuperAdmin && filterClub !== 'all') {
            basePlayers = basePlayers.filter(m => m.club === filterClub);
        }
        if (filterGender !== 'all') {
            basePlayers = basePlayers.filter(m => m.gender === filterGender);
        }

        const generationPromises = SKILL_LEVELS.map(async (levelInfo) => {
            const levelPlayers = basePlayers.filter(m => m.skillLevel === levelInfo.value);
            
            const club = CLUBS.find(c => c.value === filterClub);
            const clubLabel = filterClub === 'all' ? '전체' : (club && club.label);
            const genderLabel = filterGender === 'all' ? '' : (filterGender === Gender.MALE ? '남자' : '여자');
            const levelLabel = levelInfo.label;
            const gameLabel = gameType === GameType.DOUBLES ? '복식' : '단식';
            
            const tournamentName = `${clubLabel} ${genderLabel} ${levelLabel} ${gameLabel}`.replace(/\s+/g, ' ').trim();
            
            return generateSingleBracket(levelPlayers, tournamentName, gameType);
        });

        try {
            const results = await Promise.all(generationPromises);
            const newTournaments = results.filter(t => t !== null);

            if (newTournaments.length > 0) {
                newTournaments.forEach(onAdd);
                setActiveTournamentId(newTournaments[newTournaments.length - 1].id);
            } else {
                setError('일괄 생성할 수 있는 등급이 없습니다. 필터 조건을 확인하거나 참가 인원이 충분한지 확인해주세요.');
            }
        } catch (e) {
            setError('일괄 생성 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = () => {
        if (activeTournamentId && window.confirm(`'${activeTournament ? activeTournament.name : ''}' 대진표를 삭제하시겠습니까?`)) {
            onDelete(activeTournamentId);
        }
    };

    return React.createElement('div', { className: "bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto space-y-8" },
        isAdmin && React.createElement('div', null,
            React.createElement('h2', { className: "text-2xl font-bold mb-4 text-brand-blue" }, "대회 대진표 생성기"),
            React.createElement('div', { className: "space-y-6 p-4 bg-gray-50 rounded-lg border border-gray-200" },
                // Step 1
                React.createElement('div', { className: "space-y-3" },
                    React.createElement('h3', { className: "font-semibold text-gray-700" }, "1. 게임 종류 선택"),
                    React.createElement('div', { className: "flex items-center space-x-4" },
                        React.createElement('label', { className: "flex items-center" }, React.createElement('input', { type: "radio", name: "gameType", value: GameType.DOUBLES, checked: gameType === GameType.DOUBLES, onChange: () => setGameType(GameType.DOUBLES), className: "mr-2" }), " 복식"),
                        React.createElement('label', { className: "flex items-center" }, React.createElement('input', { type: "radio", name: "gameType", value: GameType.SINGLES, checked: gameType === GameType.SINGLES, onChange: () => setGameType(GameType.SINGLES), className: "mr-2" }), " 단식")
                    )
                ),
                // Step 2
                React.createElement('div', { className: "space-y-3" },
                    React.createElement('h3', { className: "font-semibold text-gray-700" }, "2. 참가자 필터"),
                    React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                        isSuperAdmin && React.createElement('div', null,
                            React.createElement('label', { htmlFor: "club-filter", className: "block text-sm font-medium text-gray-600" }, "클럽"),
                            React.createElement('select', { id: "club-filter", value: filterClub, onChange: e => setFilterClub(e.target.value), className: "mt-1 w-full p-2 border border-gray-300 rounded-md" },
                                React.createElement('option', { value: "all" }, "전체 클럽"),
                                CLUBS.map(c => React.createElement('option', { key: c.value, value: c.value }, c.label))
                            )
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: "gender-filter", className: "block text-sm font-medium text-gray-600" }, "성별"),
                            React.createElement('select', { id: "gender-filter", value: filterGender, onChange: e => setFilterGender(e.target.value), className: "mt-1 w-full p-2 border border-gray-300 rounded-md" },
                                React.createElement('option', { value: "all" }, "통합"),
                                React.createElement('option', { value: Gender.MALE }, "남자"),
                                React.createElement('option', { value: Gender.FEMALE }, "여자")
                            )
                        )
                    ),
                    React.createElement('div', { className: "space-y-2 pt-2" },
                        React.createElement('label', { className: "block text-sm font-medium text-gray-600" }, "등급 (다중 선택 가능)"),
                        React.createElement('div', { className: "grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2" },
                            SKILL_LEVELS.map(l =>
                                React.createElement('label', { key: l.value, className: "flex items-center space-x-2" },
                                    React.createElement('input', { type: "checkbox", checked: filterLevels.includes(l.value), onChange: e => handleLevelCheckboxChange(l.value, e.target.checked), className: "h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue" }),
                                    React.createElement('span', null, l.label)
                                )
                            )
                        )
                    )
                ),
                // Step 3
                React.createElement('div', { className: "pt-4 border-t border-gray-200" },
                    React.createElement('h3', { className: "font-semibold text-gray-700 mb-3" }, "3. 대진표 생성"),
                    error && React.createElement('p', { className: "text-red-500 text-center mb-4" }, error),
                    React.createElement('div', { className: "flex flex-col md:flex-row gap-4" },
                        React.createElement('button', {
                            onClick: handleGenerate,
                            disabled: isLoading,
                            className: "flex-1 bg-brand-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 disabled:bg-gray-400"
                        }, isLoading ? '생성 중...' : '선택 조건으로 생성'),
                        React.createElement('button', {
                            onClick: handleGenerateAllLevels,
                            disabled: isLoading,
                            className: "flex-1 bg-shuttle-yellow text-brand-blue font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 disabled:bg-gray-400",
                            title: "현재 필터(클럽, 성별)를 기준으로 각 등급별 대진표를 모두 생성합니다."
                        }, isLoading ? '생성 중...' : '등급별 일괄 생성')
                    )
                )
            )
        ),
        isAdmin && React.createElement('hr', null),
        React.createElement('div', null,
            React.createElement('h2', { className: "text-2xl font-bold mb-4 text-brand-blue" }, "생성된 대진표"),
            tournamentList.length > 0 ?
                React.createElement('div', { className: "space-y-4" },
                    React.createElement('div', { className: "flex items-center gap-4" },
                        React.createElement('select', {
                            value: activeTournamentId || '',
                            onChange: e => setActiveTournamentId(e.target.value),
                            className: "flex-grow p-2 border border-gray-300 rounded-md focus:ring-brand-blue focus:border-brand-blue"
                        },
                            React.createElement('option', { value: "", disabled: true }, "-- 대진표 선택 --"),
                            tournamentList.map(t => React.createElement('option', { key: t.id, value: t.id }, t.name))
                        ),
                        isAdmin && React.createElement('button', { onClick: handleDelete, disabled: !activeTournamentId, className: "bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 disabled:bg-gray-300" }, "삭제")
                    ),
                    activeTournament && React.createElement(BracketDisplay, { tournament: activeTournament, onUpdate: onUpdate, currentUser: currentUser })
                ) :
                React.createElement('div', { className: "text-center py-10" },
                    React.createElement('p', { className: "text-gray-500" }, isAdmin ? '위 옵션을 선택하여 대진표를 생성해주세요.' : '운영진이 대진표를 생성할 때까지 기다려주세요.')
                )
        )
    );
};
