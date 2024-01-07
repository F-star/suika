import { Meta, StoryObj } from '@storybook/react';
import { Dropdown } from './dropdown';

const meta = {
  title: 'Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
} satisfies Meta<typeof Dropdown>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        label: 'item one',
        check: true,
        key: 'aa',
      },
      {
        type: 'divider',
      },
      {
        label: 'item two',
        suffix: 'Ctrl+1',
        key: 'bb',
      },
    ],
    onClick: (params) => {
      console.log(params);
    },
    children: <span>Click me.</span>,
  },
};
