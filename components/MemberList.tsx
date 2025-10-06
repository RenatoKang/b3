

import React, { useState, useMemo } from 'react';
import { Member, CurrentUser, Role } from '../types';
import { SKILL_LEVELS, SUPER_ADMIN_NAME, CLUBS } from '../constants';

interface MemberListProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
  currentUser: CurrentUser;
}

type DisplayMode = 'byClub' | 'byLevel';

const UserIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
);

const GridIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 8.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25v2.25A2.25 2.25 0 0 1 8.25 20.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25v2.25a2.25 2.25 0 0 1-2.25 2.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
    </svg>
);

const ListIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

const getCurrentMonth = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
}

const MemberCard: React.FC<{member: Member, onEdit: (m: Member) => void, onDelete: (id: string) => void, currentUser: CurrentUser}> = ({ member, onEdit, onDelete, currentUser }) => {
    const currentMonth = getCurrentMonth();
    const duesPaidThisMonth = member.dues?.[currentMonth] ?? false;
    const skillLevelObj = SKILL_LEVELS.find(l => l.value === member.skillLevel);
    const skillLabel = skillLevelObj?.label || member.skillLevel;
    return (
        <div key={member.id} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col">
            <div className="h-40 bg-gray-200 flex items-center justify-center">
                {member.profilePicUrl ? (
                    <img src={member.profilePicUrl} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                    <UserIcon className="w-20 h-20 text-gray-400" />
                )}
            </div>
            <div className="p-4 flex-grow">
                <h3 className="text-xl font-bold text-brand-blue">{member.name}</h3>
                <p className="text-gray-500 text-sm">{member.club}</p>
                <p className="text-gray-600 text-sm truncate" title={member.email}>{member.email}</p>
                <p className="text-gray-600 text-sm">{member.age}세, {member.gender}</p>
                <div className="mt-2">
                    <span className="inline-block bg-brand-light text-brand-blue text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                        등급: {skillLabel}
                    </span>
                    <span className={`inline-block text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full ${duesPaidThisMonth ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        금월 회비: {duesPaidThisMonth ? '납부' : '미납'}
                    </span>
                </div>
            </div>
            <div className="px-4 py-2 bg-gray-50 flex justify-end space-x-2 h-12 items-center">
                {currentUser.role === Role.ADMIN ? (
                    <>
                        <button onClick={() => onEdit(member)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                        <button onClick={() => onDelete(member.id)} className="text-sm text-red-600 hover:text-red-800 font-medium">Delete</button>
                    </>
                ) : currentUser.id === member.id ? (
                    <button onClick={() => onEdit(member)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                ) : null}
            </div>
        </div>
    );
};

const MemberRow: React.FC<{member: Member, onEdit: (m: Member) => void, onDelete: (id: string) => void, currentUser: CurrentUser}> = ({ member, onEdit, onDelete, currentUser }) => {
    const currentMonth = getCurrentMonth();
    const duesPaidThisMonth = member.dues?.[currentMonth] ?? false;
    const skillLevelObj = SKILL_LEVELS.find(l => l.value === member.skillLevel);
    const skillLabel = skillLevelObj?.label || member.skillLevel;
    return (
        <tr key={member.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                        {member.profilePicUrl ? (
                            <img className="h-10 w-10 rounded-full object-cover" src={member.profilePicUrl} alt={member.name} />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-gray-400" />
                            </div>
                        )}
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.gender}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.club}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={member.email}>{member.email}</td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-block bg-brand-light text-brand-blue text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {skillLabel}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.age}세</td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
                 <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${duesPaidThisMonth ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {duesPaidThisMonth ? '납부' : '미납'}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                {currentUser.role === Role.ADMIN ? (
                    <>
                        <button onClick={() => onEdit(member)} className="text-blue-600 hover:text-blue-900">Edit</button>
                        <button onClick={() => onDelete(member.id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </>
                ) : currentUser.id === member.id ? (
                    <button onClick={() => onEdit(member)} className="text-blue-600 hover:text-blue-900">Edit</button>
                ) : null}
            </td>
        </tr>
    );
};

export const MemberList: React.FC<MemberListProps> = ({ members, onEdit, onDelete, currentUser }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [displayMode, setDisplayMode] = useState<DisplayMode>('byClub');
    
    if (members.length === 0) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-600">No members registered yet.</h2>
                <p className="text-gray-500 mt-2">Go to the 'Register Member' tab to add the first member.</p>
            </div>
        )
    }
    
    const processedMembers = useMemo(() => {
        const sorted = [...members].sort((a, b) => a.name.localeCompare(b.name));
        
        if (currentUser.name !== SUPER_ADMIN_NAME) {
            return { type: 'flat' as const, data: sorted };
        }

        if (displayMode === 'byClub') {
            const groups: Record<string, Member[]> = {};
            CLUBS.forEach(club => {
                const membersInClub = sorted.filter(m => m.club === club.value);
                if (membersInClub.length > 0) {
                    groups[club.label] = membersInClub;
                }
            });
            return { type: 'grouped' as const, data: groups };
        }

        if (displayMode === 'byLevel') {
            const groups: Record<string, Member[]> = {};
            SKILL_LEVELS.forEach(level => {
                const membersInLevel = sorted.filter(m => m.skillLevel === level.value);
                if (membersInLevel.length > 0) {
                    groups[level.label] = membersInLevel;
                }
            });
            return { type: 'grouped' as const, data: groups };
        }
        
        return { type: 'flat' as const, data: sorted };
    }, [members, displayMode, currentUser.name]);

    const displayOptions: {key: DisplayMode, label: string}[] = [
        { key: 'byClub', label: '클럽별' },
        { key: 'byLevel', label: '등급별' },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-700">총 회원: {members.length}명</h2>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        aria-label="Grid View"
                        title="Grid View"
                    >
                        <GridIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        aria-label="List View"
                        title="List View"
                    >
                        <ListIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {currentUser.name === SUPER_ADMIN_NAME && (
                <div className="flex items-center space-x-2 mb-6 bg-gray-100 p-2 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 mr-2">보기 방식:</span>
                    {displayOptions.map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => setDisplayMode(opt.key)}
                            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                                displayMode === opt.key 
                                ? 'bg-brand-blue text-white' 
                                : 'bg-white text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
            
            {processedMembers.type === 'flat' ? (
                viewMode === 'grid' ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {processedMembers.data.map(member => (
                            <MemberCard key={member.id} member={member} onEdit={onEdit} onDelete={onDelete} currentUser={currentUser} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">소속 클럽</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등급</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">나이</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">금월 회비</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {processedMembers.data.map(member => (
                                        <MemberRow key={member.id} member={member} onEdit={onEdit} onDelete={onDelete} currentUser={currentUser} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            ) : ( // Grouped view
                viewMode === 'grid' ? (
                    <div className="space-y-8">
                        {Object.entries(processedMembers.data).map(([groupName, groupMembers]) => {
                            const membersInGroup = groupMembers as Member[];
                            return (
                            <div key={groupName}>
                                <h3 className="text-xl font-bold text-gray-800 border-b-2 border-brand-blue pb-2 mb-4">
                                    {groupName} <span className="font-normal text-base text-gray-600">({membersInGroup.length}명)</span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {membersInGroup.map(member => (
                                        <MemberCard key={member.id} member={member} onEdit={onEdit} onDelete={onDelete} currentUser={currentUser} />
                                    ))}
                                </div>
                            </div>
                        )})}
                    </div>
                ) : ( // Grouped List View
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">소속 클럽</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등급</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">나이</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">금월 회비</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Object.entries(processedMembers.data).map(([groupName, groupMembers]) => {
                                        const membersInGroup = groupMembers as Member[];
                                        return (
                                        <React.Fragment key={groupName}>
                                            <tr>
                                                <th colSpan={7} className="px-4 py-2 bg-brand-light text-left text-base font-bold text-brand-blue">
                                                    {groupName} ({membersInGroup.length}명)
                                                </th>
                                            </tr>
                                            {membersInGroup.map(member => (
                                                <MemberRow key={member.id} member={member} onEdit={onEdit} onDelete={onDelete} currentUser={currentUser} />
                                            ))}
                                        </React.Fragment>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};