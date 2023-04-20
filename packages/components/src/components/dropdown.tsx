import { FC, PropsWithChildren } from 'react';

interface IProps extends PropsWithChildren {
  id: string;
}

export const Dropdown: FC<IProps> = (props: IProps) => {
  return <div>Dropdown Component{props.id}</div>;
};
