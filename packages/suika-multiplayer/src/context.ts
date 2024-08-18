import { type SuikaEditor } from '@suika/core';
import { createContext } from 'react';

const EditorContext = createContext<SuikaEditor | null>(null);

export { EditorContext };
