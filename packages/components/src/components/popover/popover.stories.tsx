import type { Meta, StoryObj } from '@storybook/react';
import { Popover } from './popover';

const meta = {
  title: 'Popover',
  component: Popover,
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: <div style={{ padding: 8 }}>This is content</div>,
    children: <span>Click me.</span>,
    placement: 'bottom',
  },
};
