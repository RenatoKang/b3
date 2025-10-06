import React from 'react';
import { SKILL_LEVELS } from '../constants.js';

const UserIcon = ({ className }) => (
    React.createElement('svg', { className, xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" })
    )
);

const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const InfoRow = ({ label, value }) => (
    React.createElement('div', { className: "py-3 sm:grid sm:grid-cols-3 sm:gap-4" },
        React.createElement('dt', { className: "text-sm font-medium text-gray-500" }, label),
        React.createElement('dd', { className: "mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2" }, value || '-')
    )
);

export const ProfilePage = ({ currentUser, onEdit }) => {
    const { name, email, profilePicUrl, club, skillLevel, gender, dob, whatsapp } = currentUser;
    const skillLabel = SKILL_LEVELS.find(l => l.value === skillLevel)?.label || skillLevel;
    const age = calculateAge(dob);

    return (
        React.createElement('div', { className: "bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto" },
            React.createElement('div', { className: "md:flex md:items-start md:space-x-8" },
                React.createElement('div', { className: "flex-shrink-0 mb-6 md:mb-0" },
                    React.createElement('div', { className: "w-40 h-40 rounded-full bg-gray-200 mx-auto flex items-center justify-center overflow-hidden border-4 border-white shadow-md" },
                        profilePicUrl ? (
                            React.createElement('img', { src: profilePicUrl, alt: name, className: "w-full h-full object-cover" })
                        ) : (
                            React.createElement(UserIcon, { className: "w-24 h-24 text-gray-400" })
                        )
                    )
                ),
                React.createElement('div', { className: "flex-grow" },
                    React.createElement('div', { className: "flex justify-between items-center border-b pb-4" },
                        React.createElement('div', null,
                            React.createElement('h2', { className: "text-3xl font-bold text-brand-blue" }, name),
                            React.createElement('p', { className: "text-gray-600" }, email)
                        ),
                        React.createElement('button', { onClick: onEdit, className: "bg-brand-secondary text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-blue transition-colors" },
                            "프로필 수정"
                        )
                    ),
                    React.createElement('div', { className: "mt-6 divide-y divide-gray-200" },
                        React.createElement(InfoRow, { label: "소속 클럽", value: club }),
                        React.createElement(InfoRow, { label: "등급", value: skillLabel }),
                        React.createElement(InfoRow, { label: "성별", value: gender }),
                        React.createElement(InfoRow, { label: "생년월일", value: dob }),
                        React.createElement(InfoRow, { label: "나이", value: age ? `${age}세` : '미등록' }),
                        React.createElement(InfoRow, { label: "Whatsapp", value: whatsapp })
                    )
                )
            )
        )
    );
};