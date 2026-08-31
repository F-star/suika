export interface DropdownDivider {
  type: 'divider';
}

export interface DropDownItemType {
  key: string;
  label: string;
  suffix?: string;
  check?: boolean;
  disabled?: boolean;
  children?: Item[];
}

export type Item = DropDownItemType | DropdownDivider;

export interface DropdownEvents {
  openSubMenu(key: string): void;
}
