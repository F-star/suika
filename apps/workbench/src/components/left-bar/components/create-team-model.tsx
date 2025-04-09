import { Input, InputRef, Modal } from 'antd';
import { FC, useEffect, useRef, useState } from 'react';

interface IProps {
  open: boolean;
  setOpen: (val: boolean) => void;
  onCreateTeam: (name: string) => void;
}

export const CreateTeamModal: FC<IProps> = (props) => {
  const [teamName, setTeamName] = useState('');
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    if (props.open) {
      const el = inputRef.current?.nativeElement;
      if (el) {
        el.innerText = '';
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [props.open]);

  return (
    <Modal
      title="create new team"
      open={props.open}
      okText="create team"
      width={450}
      transitionName=""
      footer={(_, { OkBtn }) => (
        <>
          <OkBtn />
        </>
      )}
      onCancel={() => props.setOpen(false)}
      onOk={() => {
        props.onCreateTeam(teamName);
        props.setOpen(false);
      }}
    >
      <div style={{ padding: '16px 0' }}>
        <Input
          ref={inputRef}
          placeholder="input team name"
          onChange={(e) => setTeamName(e.target.value)}
        />
      </div>
    </Modal>
  );
};
