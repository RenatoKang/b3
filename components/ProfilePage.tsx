import React from 'react';
import { CurrentUser } from '../types';
import { SKILL_LEVELS } from '../constants';

interface ProfilePageProps {
  currentUser: CurrentUser;
  onEdit: () => void;
}

const UserIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
);

const calculateAge = (dob: string): number | null => {
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

const InfoRow: React.FC<{label: string, value: React.ReactNode}> = ({ label, value }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{value || '-'}</dd>
    </div>
);

export const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onEdit }) => {
    const { name, email, profilePicUrl, club, skillLevel, gender, dob, whatsapp } = currentUser;
    const skillLabel = SKILL_LEVELS.find(l => l.value === skillLevel)?.label || skillLevel;
    const age = calculateAge(dob);

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <div className="md:flex md:items-start md:space-x-8">
                <div className="flex-shrink-0 mb-6 md:mb-0">
                    <div className="w-40 h-40 rounded-full bg-gray-200 mx-auto flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                        {profilePicUrl ? (
                            <img src={profilePicUrl} alt={name} className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-24 h-24 text-gray-400" />
                        )}
                    </div>
                </div>
                <div className="flex-grow">
                    <div className="flex justify-between items-center border-b pb-4">
                        <div>
                            <h2 className="text-3xl font-bold text-brand-blue">{name}</h2>
                            <p className="text-gray-600">{email}</p>
                        </div>
                        <button onClick={onEdit} className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-blue transition-colors">
                            프로필 수정
                        </button>
                    </div>
                    <div className="mt-6 divide-y divide-gray-200">
                        <InfoRow label="소속 클럽" value={club} />
                        <InfoRow label="등급" value={skillLabel} />
                        <InfoRow label="성별" value={gender} />
                        <InfoRow label="생년월일" value={dob} />
                        <InfoRow label="나이" value={age ? `${age}세` : '미등록'} />
                        <InfoRow label="Whatsapp" value={whatsapp} />
                    </div>
                </div>
            </div>
        </div>
    );
};