import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Select } from './select';

const meta = {
  title: 'Select',
  component: Select,
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: '1',
    options: [
      { value: '1', label: 'One' },
      { value: '2', label: 'Two' },
      { value: '3', label: 'Three' },
    ],
    style: { width: 150 },
    dropdownWidth: 150,
  },
};

const SelectWithState = () => {
  const [value, setValue] = useState('1');
  const width = 100;
  return (
    <Select
      value={value}
      options={[
        { value: '1', label: 'One' },
        { value: '2', label: 'Two' },
        { value: '3', label: 'Three' },
      ]}
      bordered={false}
      style={{ width }}
      dropdownWidth={width}
      onSelect={(value) => setValue(value)}
    />
  );
};

export const Primary: Story = {
  render: () => <SelectWithState />,
};
