import { createContext } from 'react';
import { Editor } from '@suika/core';

const EditorContext = createContext<Editor | null>(null);

export { EditorContext };
