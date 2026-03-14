import { Participant } from '../types';

export const getParticipantName = (id: string, participants: Participant[], currentUserId?: string | null) => {
  const participant = participants.find(p => p.id === id);
  const name = participant ? participant.name : 'לא ידוע';
  if (currentUserId && id === currentUserId) {
    return `${name} (אני)`;
  }
  return name;
};

export const formatParticipantName = (name: string, isCurrentUser: boolean) => {
  if (isCurrentUser) {
    return `${name} (אני)`;
  }
  return name;
};
