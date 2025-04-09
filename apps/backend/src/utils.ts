import * as Y from 'yjs';

let initialDocBuffer: Buffer | null = null;

export const generateInitialDoc = () => {
  if (initialDocBuffer) {
    return initialDocBuffer;
  }
  const suikaDoc = {
    objectName: 'Document',
    width: 0,
    height: 0,
    type: 'Document',
    id: '0-0',
    transform: [1, 0, 0, 1, 0, 0],
    strokeWidth: 1,
  };
  const suikaCanvas = {
    objectName: 'Canvas',
    width: 0,
    height: 0,
    type: 'Canvas',
    id: '0-1',
    transform: [1, 0, 0, 1, 0, 0],
    strokeWidth: 1,
  };

  const yDoc = new Y.Doc();
  const yMap = yDoc.getMap('nodes');
  yMap.set(suikaDoc.id, suikaDoc);
  yMap.set(suikaCanvas.id, suikaCanvas);

  initialDocBuffer = Buffer.from(Y.encodeStateAsUpdate(yDoc));
  return initialDocBuffer;
};
