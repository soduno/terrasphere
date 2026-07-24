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
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingLinked?: boolean;
    margin?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    marginLinked?: boolean;
    backgroundColor?: string;
    float?: 'none' | 'left' | 'right';
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: string;
    color?: string;
    borderRadius?: string;
    imageUrl?: string;
    imageWidth?: string;
    imageHeight?: string;
    imageAlign?: 'left' | 'center' | 'right';
    contentAlign?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'center' | 'bottom';
    width?: string;
    columnGap?: string;
    columnCount?: number;
  };
  children?: EditorElement[];
  columnIndex?: number;
}

export const DEFAULT_PROPERTIES = {
  padding: '0',
  paddingLinked: true,
  margin: '0',
  marginLinked: true,
  backgroundColor: 'transparent',
  float: 'none' as const,
  textAlign: 'left' as const,
  contentAlign: 'left' as const,
  verticalAlign: 'top' as const,
  fontSize: '16',
  color: '#000000',
  borderRadius: '0',
  columnGap: '20',
};
