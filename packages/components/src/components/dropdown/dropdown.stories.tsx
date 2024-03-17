import { type Meta, type StoryObj } from '@storybook/react';

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
        suffix: 'Ctrl+1',
        key: 'aa',
      },
      {
        type: 'divider',
      },
      {
        label: 'item two',
        key: 'bb',
        children: [
          {
            label: 'item two one',
            key: 'bb-1',
          },
          {
            label: 'item two two',
            key: 'bb-2',
          },
        ],
      },
      {
        label: 'item three',
        key: 'cc',
        children: [
          {
            label: 'item three one',
            key: 'cc-1',
          },
          {
            label: 'item three two',
            key: 'cc-2',
          },
        ],
      },
    ],
    onClick: (params) => {
      console.log(params);
    },
    children: <span>Click me.</span>,
  },
};
