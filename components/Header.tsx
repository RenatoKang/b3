import React from 'react';
import { View, CurrentUser } from '../types';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
  memberCount: number;
  currentUser: CurrentUser | null;
  onLogout: () => void;
}

const ShuttlecockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 3.939V2h-2v1.939A9.503 9.503 0 0 0 6.643 7.4L5 6.4V5H3v1.4l1.643 1L3 8.8v1.2l1.643-1L3 10.4V11.6l1.643-1L3 12v1h2v-.4l1.643-1A9.503 9.503 0 0 0 11 15.061V22h2v-6.939a9.503 9.503 0 0 0 4.357-3.462L19 12v-1h-2v.4l-1.643 1A9.503 9.503 0 0 0 13 3.939z"/>
    </svg>
);


export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, memberCount, currentUser, onLogout }) => {
  const navItems = [
    { view: View.ADD_MEMBER, label: '회원 등록', requiresMembers: false },
    { view: View.MEMBERS, label: '회원 명단', requiresMembers: true },
    { view: View.DUES, label: '회비 관리', requiresMembers: true },
    { view: View.TOURNAMENT, label: '대진표 생성', requiresMembers: true },
    { view: View.TRAINING, label: '훈련 계획', requiresMembers: false },
  ];

  return (
    <header className="bg-brand-blue shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
             <ShuttlecockIcon className="h-8 w-8 text-shuttle-yellow" />
            <h1 className="text-2xl font-bold text-white ml-3">배드민턴 클럽 매니저</h1>
          </div>
          {currentUser && (
            <div className="flex items-center space-x-4">
                <button onClick={() => onNavigate(View.PROFILE)} className="text-right text-white p-2 rounded-md hover:bg-white/10 transition-colors">
                    <p className="font-semibold">{currentUser.name} 님</p>
                    <p className="text-xs opacity-80">{currentUser.club || '클럽 미지정'} / {currentUser.role === 'ADMIN' ? '운영진' : '회원'}</p>
                </button>
                <button onClick={onLogout} className="text-sm bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded">
                  로그아웃
                </button>
            </div>
          )}
        </div>
        <nav className="flex justify-around p-2 bg-brand-secondary rounded-b-lg space-x-2">
             {navItems.map(item => {
               const isDisabled = item.requiresMembers && memberCount === 0;
               return (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                disabled={isDisabled}
                className={`px-2 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex-1 ${
                  currentView === item.view
                    ? 'bg-shuttle-yellow text-brand-blue'
                    : 'text-white hover:bg-brand-blue'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isDisabled ? '먼저 회원을 등록해주세요.' : ''}
              >
                {item.label}
              </button>
            )})}
        </nav>
      </div>
    </header>
  );
};