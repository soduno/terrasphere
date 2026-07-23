export type ElementType = 
  | 'heading' 
  | 'text' 
  | 'wysiwyg'
  | 'image' 
  | 'calendar'
  | 'flex' 
  | 'grid';

export interface EditorElement {
  id: string;
  type: ElementType;
  content?: string;
  properties: {
    padding?: string;
    margin?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: string;
    color?: string;
    borderRadius?: string;
    imageUrl?: string;
    columnGap?: string;
    columnCount?: number;
  };
  children?: EditorElement[];
  columnIndex?: number;
}

export const DEFAULT_PROPERTIES = {
  padding: '20',
  margin: '10',
  backgroundColor: 'transparent',
  textAlign: 'left' as const,
  fontSize: '16',
  color: '#000000',
  borderRadius: '0',
  columnGap: '20',
};