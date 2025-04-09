import { ClockCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { ConfigProvider, GetProp, Menu, MenuProps, Select } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';

import { ApiService } from '../../api-service';
import { useTeamsStore } from '../../state/team';
import { CreateTeamModal } from './components/create-team-model';
import { TeamLogo } from './components/team-logo';
import styles from './left-bar.module.less';

type MenuItem = GetProp<MenuProps, 'items'>[number];

export const LeftBar = () => {
  const [isCreateTeamModelOpen, setIsCreateTeamModelOpen] = useState(false);
  const { teamId: pageTeamId } = useParams<{ teamId: string }>();
  const teams = useTeamsStore((state) => state.teams);

  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(
    undefined,
  );

  const fetchTeamsInfo = useCallback(async () => {
    return ApiService.getTeams().then((res) => {
      useTeamsStore.setState({ teams: res.data });

      const currTeamId = res.data.find((team) => team.id == pageTeamId)
        ? pageTeamId
        : res.data[0].id;

      setSelectedTeamId(currTeamId);
    });
  }, [pageTeamId]);

  const onCreateTeam = async (teamName: string) => {
    const res = await ApiService.createTeam(teamName);
    await fetchTeamsInfo();
    window.location.pathname = `/files/team/${res.data.id}/all-projects`;
  };

  useEffect(() => {
    fetchTeamsInfo();
  }, [fetchTeamsInfo]);

  // TODO: if teamId is not in teams, then redirect to the first team

  const menuItems: MenuItem[] = [
    {
      label: (
        <NavLink to={`/files/team/${selectedTeamId}/recents`}>recents</NavLink>
      ),
      key: `/files/team/${selectedTeamId}/recents`,
      icon: <ClockCircleOutlined />,
    },
    {
      type: 'divider',
      style: { margin: '14px 0' },
    },
  ];

  const teamMenuItems: MenuItem[] = [
    {
      label: (
        <NavLink to={`/files/team/${selectedTeamId}/drafts`}>drafts</NavLink>
      ),
      key: `/files/team/${selectedTeamId}/drafts`,
    },
    {
      label: (
        <NavLink to={`/files/team/${selectedTeamId}/all-projects`}>
          all projects
        </NavLink>
      ),
      key: `/files/team/${selectedTeamId}/all-projects`,
    },
    {
      label: (
        <NavLink to={`/files/team/${selectedTeamId}/trash`}>trash</NavLink>
      ),
      key: `/files/team/${selectedTeamId}/trash`,
    },
    {
      type: 'divider',
      style: { margin: '14px 0' },
    },
    {
      label: (
        <div onClick={() => setIsCreateTeamModelOpen(true)}>
          <PlusOutlined />
          <span style={{ marginLeft: 12 }}>create team</span>
        </div>
      ),
      key: 'create-team',
    },
  ];

  const changeTeam = (teamId: string) => {
    setSelectedTeamId(teamId);
    location.pathname = `/files/team/${teamId}/all-projects`;
  };

  return (
    <div>
      <div className={styles.logo}>Suika</div>

      <ConfigProvider
        theme={{
          components: {
            Menu: {
              itemBorderRadius: 2,
              itemSelectedColor: '#000',
              itemHeight: 32,
              iconMarginInlineEnd: 6,
            },
          },
        }}
      >
        <Menu items={menuItems} selectedKeys={[location.pathname]} />
        <Select
          value={selectedTeamId}
          variant="borderless"
          dropdownStyle={{ width: '200px' }}
          style={{ marginLeft: 8 }}
          onChange={changeTeam}
        >
          {teams.map((team) => (
            <Select.Option key={team.id} value={team.id}>
              <div className={styles.teamItem}>
                <TeamLogo id={team.id} />
                {team.name}
              </div>
            </Select.Option>
          ))}
        </Select>
        <Menu items={teamMenuItems} selectedKeys={[location.pathname]} />
      </ConfigProvider>
      <CreateTeamModal
        open={isCreateTeamModelOpen}
        setOpen={setIsCreateTeamModelOpen}
        onCreateTeam={onCreateTeam}
      />
    </div>
  );
};
