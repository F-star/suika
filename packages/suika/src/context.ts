import { createContext } from 'react';
import { Editor } from './editor/editor';


const EditorContext = createContext<Editor | null>(null);

export {
  EditorContext,
};