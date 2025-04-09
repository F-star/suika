import { useParams } from 'react-router-dom';

import { useTeamsStore } from '../../state/team';

export const TeamPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const team = useTeamsStore((state) => state.getTeamById(teamId!));

  if (!team) {
    return <div></div>;
  }

  return (
    <div>
      <div>{team.name}</div>
    </div>
  );
};
