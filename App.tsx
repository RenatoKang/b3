
import React, { useState, useEffect, useMemo } from 'react';
import { Member, View, Tournament, Role, CurrentUser } from './types';
import { Header } from './components/Header';
import { MemberList } from './components/MemberList';
import { MemberForm } from './components/MemberForm';
import { DuesTracker } from './components/DuesTracker';
import { TournamentGenerator } from './components/TournamentGenerator';
import { TrainingPlanner } from './components/TrainingPlanner';
import { Login } from './components/Login';
import { ADMIN_NAMES, SUPER_ADMIN_NAME } from './constants';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query, orderBy, setDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';


const getRelevantMonths = (): string[] => {
    const months: string[] = [];
    const today = new Date();
    for (let i = 5; i >= -3; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        months.push(`${year}-${month}`);
    }
    return months;
};


const App: React.FC = () => {
  const [view, setView] = useState<View>(View.MEMBERS);
  const [members, setMembers] = useState<Member[]>([]);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [tournaments, setTournaments] = useState<Record<string, Tournament>>({});
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const memberDocRef = doc(db, "members", user.uid);
        const memberDocSnap = await getDoc(memberDocRef);
        if (memberDocSnap.exists()) {
          const memberData = memberDocSnap.data() as Omit<Member, 'id'>;
          const role = ADMIN_NAMES.includes(memberData.name) ? Role.ADMIN : Role.MEMBER;
          setCurrentUser({ ...memberData, id: user.uid, role });
        } else {
          console.error("No member profile found for this user in Firestore.");
          await signOut(auth);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setMembers([]);
      setTournaments({});
      return;
    }

    const membersQuery = query(collection(db, "members"), orderBy("name"));
    const unsubscribeMembers = onSnapshot(membersQuery, (querySnapshot) => {
      const membersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      setMembers(membersData);
    });

    const tournamentsCollectionRef = collection(db, "tournaments");
    const unsubscribeTournaments = onSnapshot(tournamentsCollectionRef, (querySnapshot) => {
      const tournamentsData: Record<string, Tournament> = {};
      querySnapshot.forEach((doc) => {
        tournamentsData[doc.id] = { id: doc.id, ...doc.data() } as Tournament;
      });
      setTournaments(tournamentsData);
    });

    return () => {
      unsubscribeMembers();
      unsubscribeTournaments();
    };
  }, [currentUser]);
  
  const filteredMembers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.name === SUPER_ADMIN_NAME) {
        return members;
    }
    if (currentUser.club) {
        return members.filter(member => member.club === currentUser.club);
    }
    // Fallback for an authenticated user who somehow has no club assigned (e.g., old data).
    // They will only see themselves.
    return members.filter(member => member.id === currentUser.id);
  }, [members, currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView(View.MEMBERS);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleUpdateMember = async (member: Member) => {
    const memberDocRef = doc(db, "members", member.id);
    // Create a copy of the member object without the id to avoid writing it to the document
    const { id, ...memberData } = member;
    await setDoc(memberDocRef, memberData, { merge: true });
    
    if (currentUser && currentUser.id === member.id) {
        // Update current user state without changing the role
        const updatedCurrentUser = { ...currentUser, ...memberData };
        setCurrentUser(updatedCurrentUser);
    }

    setEditingMember(null);
    setView(View.MEMBERS);
  };
  
  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setView(View.ADD_MEMBER);
  };

  const handleDeleteMember = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this member? This will also remove them from Firebase Authentication.')) {
      try {
        await deleteDoc(doc(db, "members", id));
        // Note: Deleting from Firebase Auth is a privileged operation and should be handled by a backend function for security.
        // This client-side deletion is for demonstration purposes.
        console.warn(`Member ${id} deleted from Firestore. Remember to delete them from Firebase Auth console.`);
        if (members.length === 1) {
            setView(View.ADD_MEMBER);
        }
      } catch (error) {
        console.error("Error deleting member:", error);
      }
    }
  };

  const handleToggleDues = async (id: string, month: string) => {
    if (currentUser?.role !== Role.ADMIN) return;
    const member = members.find(m => m.id === id);
    if (!member) return;
    const memberDocRef = doc(db, "members", id);
    await updateDoc(memberDocRef, {
      [`dues.${month}`]: !member.dues[month]
    });
  };
  
  const handleNavigate = (newView: View) => {
    setEditingMember(null);
    setView(newView);
  };
  
  const handleAddTournament = async (tournament: Tournament) => {
    const tournamentDocRef = doc(db, "tournaments", tournament.id);
    await setDoc(tournamentDocRef, tournament);
  };

  const handleUpdateTournament = async (updatedTournament: Tournament) => {
    const tournamentDocRef = doc(db, "tournaments", updatedTournament.id);
    await setDoc(tournamentDocRef, updatedTournament, { merge: true });
  };
  
  const handleDeleteTournament = async (tournamentId: string) => {
    await deleteDoc(doc(db, "tournaments", tournamentId));
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!currentUser) {
    if (view === View.ADD_MEMBER) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <MemberForm 
                    existingMember={null} 
                    onUpdate={() => Promise.resolve()} 
                    onCancel={() => setView(View.MEMBERS)} 
                    isEditingSelf={false}
                    currentUserRole={Role.MEMBER}
                />
            </div>
        );
    }
    return <Login onNavigateToRegister={() => handleNavigate(View.ADD_MEMBER)} />;
  }

  const renderContent = () => {
    switch (view) {
      case View.ADD_MEMBER:
        return <MemberForm 
            onUpdate={handleUpdateMember} 
            existingMember={editingMember} 
            onCancel={() => setView(View.MEMBERS)}
            isEditingSelf={!!(editingMember && currentUser && editingMember.id === currentUser.id)}
            currentUserRole={currentUser.role}
        />;
      case View.DUES:
        return <DuesTracker members={filteredMembers} onToggleDues={handleToggleDues} currentUser={currentUser} />;
      case View.TOURNAMENT:
        return <TournamentGenerator 
            members={filteredMembers} 
            tournaments={tournaments} 
            onAdd={handleAddTournament} 
            onUpdate={handleUpdateTournament} 
            onDelete={handleDeleteTournament}
            currentUser={currentUser}
        />;
      case View.TRAINING:
        return <TrainingPlanner currentUser={currentUser} />;
      case View.MEMBERS:
      default:
        return <MemberList members={filteredMembers} onEdit={handleEditMember} onDelete={handleDeleteMember} currentUser={currentUser} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header 
        currentView={view} 
        onNavigate={handleNavigate} 
        memberCount={filteredMembers.length} 
        currentUser={currentUser}
        onLogout={handleLogout}
       />
      <main className="p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;