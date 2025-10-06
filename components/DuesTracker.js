

import React, { useMemo } from 'react';
import { Role, Club } from '../types.js';
import { SKILL_LEVELS, CLUBS } from '../constants.js';

const getRelevantMonths = () => {
    const months = [];
    const today = new Date();
    // From 5 months ago to 3 months in the future.
    for (let i = 5; i >= -3; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        months.push(`${year}-${month}`);
    }
    return months;
};

export const DuesTracker = ({ members, onToggleDues, currentUser }) => {
    
    if (members.length === 0) {
        return (
            React.createElement('div', { className: "text-center py-12" },
                React.createElement('h2', { className: "text-xl font-semibold text-gray-600" }, "No members to track."),
                React.createElement('p', { className: "text-gray-500 mt-2" }, "Register members first to manage their dues.")
            )
        )
    }

    const months = getRelevantMonths();
    const isAdmin = currentUser.role === Role.ADMIN;

    const groupedMembers = useMemo(() => {
        const groups = {};
        
        const clubOrder = CLUBS.map(c => c.value);

        const sorted = [...members].sort((a, b) => {
             const clubComparison = clubOrder.indexOf(a.club) - clubOrder.indexOf(b.club);
            if (clubComparison !== 0) return clubComparison;
            return a.name.localeCompare(b.name);
        });

        sorted.forEach(member => {
            const clubName = member.club || Club.UNAFFILIATED;
            if (!groups[clubName]) {
                groups[clubName] = [];
            }
            groups[clubName].push(member);
        });

        return Object.entries(groups);

    }, [members]);

    return (
        React.createElement('div', { className: "bg-white p-6 rounded-lg shadow-lg max-w-full mx-auto" },
            React.createElement('h2', { className: "text-2xl font-bold mb-6 text-brand-blue" }, "회비 납부 현황"),
            React.createElement('div', { className: "overflow-x-auto" },
                React.createElement('table', { className: "min-w-full divide-y divide-gray-200" },
                    React.createElement('thead', { className: "bg-gray-50" },
                        React.createElement('tr', null,
                            React.createElement('th', { scope: "col", className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10" }, "이름"),
                            React.createElement('th', { scope: "col", className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "등급"),
                            months.map(month => (
                               React.createElement('th', { key: month, scope: "col", className: "px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" }, month)
                            ))
                        )
                    ),
                    React.createElement('tbody', { className: "bg-white divide-y divide-gray-200" },
                        groupedMembers.map(([clubName, clubMembers]) => (
                            React.createElement(React.Fragment, { key: clubName },
                                React.createElement('tr', null,
                                    React.createElement('th', { colSpan: 2 + months.length, className: "px-4 py-2 bg-brand-light text-left text-base font-bold text-brand-blue sticky left-0" },
                                       `${clubName} (${clubMembers.length}명)`
                                    )
                                ),
                                clubMembers.map(member => {
                                    const skillLabel = SKILL_LEVELS.find(l => l.value === member.skillLevel)?.label || member.skillLevel;
                                    return (
                                        React.createElement('tr', { key: member.id },
                                            React.createElement('td', { className: "px-4 py-4 whitespace-nowrap sticky left-0 bg-white font-medium text-gray-900" }, member.name),
                                            React.createElement('td', { className: "px-4 py-4 whitespace-nowrap text-sm text-gray-700" }, skillLabel),
                                            months.map(month => (
                                                React.createElement('td', { key: month, className: "px-4 py-4 whitespace-nowrap text-center" },
                                                    React.createElement('span', 
                                                        { 
                                                            onClick: isAdmin ? () => onToggleDues(member.id, month) : undefined,
                                                            className: `px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${member.dues?.[month] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`
                                                        },
                                                        member.dues?.[month] ? '납부' : '미납'
                                                    )
                                                )
                                            ))
                                        )
                                    );
                                })
                            )
                        ))
                    )
                )
            )
        )
    );
};