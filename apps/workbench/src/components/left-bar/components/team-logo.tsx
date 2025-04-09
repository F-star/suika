import { getRandomColor } from '../../../utils';

interface IProps {
  id: string;
}

export const TeamLogo = ({ id }: IProps) => {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 16,
        height: 16,
        borderRadius: 4,
        marginRight: 8,
        backgroundColor: getRandomColor(id + ''),
      }}
    ></span>
  );
};
