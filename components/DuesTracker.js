

import React from 'react';
import { Role } from '../types.js';
import { SKILL_LEVELS } from '../constants.js';

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

    return (
        React.createElement('div', { className: "bg-white p-6 rounded-lg shadow-lg max-w-full mx-auto" },
            React.createElement('h2', { className: "text-2xl font-bold mb-6 text-brand-blue" }, "회비 납부 현황"),
            React.createElement('div', { className: "overflow-x-auto" },
                React.createElement('table', { className: "min-w-full divide-y divide-gray-200" },
                    React.createElement('thead', { className: "bg-gray-50" },
                        React.createElement('tr', null,
                            React.createElement('th', { scope: "col", className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10" }, "이름"),
                            React.createElement('th', { scope: "col", className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "소속 클럽"),
                            React.createElement('th', { scope: "col", className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "등급"),
                            months.map(month => (
                               React.createElement('th', { key: month, scope: "col", className: "px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" }, month)
                            ))
                        )
                    ),
                    React.createElement('tbody', { className: "bg-white divide-y divide-gray-200" },
                        members.sort((a,b) => a.name.localeCompare(b.name)).map(member => {
                            const skillLevelObj = SKILL_LEVELS.find(l => l.value === member.skillLevel);
                            const skillLabel = (skillLevelObj && skillLevelObj.label) || member.skillLevel;
                            return (
                                React.createElement('tr', { key: member.id },
                                    React.createElement('td', { className: "px-4 py-4 whitespace-nowrap sticky left-0 bg-white font-medium text-gray-900" }, member.name),
                                    React.createElement('td', { className: "px-4 py-4 whitespace-nowrap text-sm text-gray-700" }, member.club),
                                    React.createElement('td', { className: "px-4 py-4 whitespace-nowrap text-sm text-gray-700" }, skillLabel),
                                    months.map(month => {
                                        const isPaid = member.dues && member.dues[month];
                                        return React.createElement('td', { key: month, className: "px-4 py-4 whitespace-nowrap text-center" },
                                            React.createElement('span', 
                                                {
                                                    onClick: isAdmin ? () => onToggleDues(member.id, month) : undefined,
                                                    className: `px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`
                                                },
                                                isPaid ? '납부' : '미납'
                                            )
                                        )
                                    })
                                )
                            );
                        })
                    )
                )
            )
        )
    );
};