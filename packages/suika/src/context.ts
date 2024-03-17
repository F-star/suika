import { type Editor } from '@suika/core';
import { createContext } from 'react';

const EditorContext = createContext<Editor | null>(null);

export { EditorContext };
