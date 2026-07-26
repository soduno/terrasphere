import {
  AlignLeft,
  Calendar as CalendarIcon,
  FileText,
  Grid3x3,
  Image,
  Layout,
  Type,
} from 'lucide-react';
import {
  DEFAULT_PROPERTIES,
  type EditorElement,
  type EditorSidebarGroup,
  type ElementType,
} from '../../types/editor';

export const EDITOR_ELEMENT_GROUPS: EditorSidebarGroup[] = [
  {
    title: 'Layout',
    elements: [
      {
        type: 'flex',
        icon: Layout,
        label: 'Flex Container',
        accent: 'indigo',
      },
      {
        type: 'grid',
        icon: Grid3x3,
        label: 'Grid Container',
        accent: 'indigo',
      },
    ],
  },
  {
    title: 'Content',
    elements: [
      { type: 'heading', icon: Type, label: 'Heading', accent: 'purple' },
      { type: 'text', icon: AlignLeft, label: 'Text', accent: 'purple' },
      {
        type: 'wysiwyg',
        icon: FileText,
        label: 'Rich Text',
        accent: 'purple',
      },
    ],
  },
  {
    title: 'Media',
    elements: [
      { type: 'image', icon: Image, label: 'Image', accent: 'pink' },
      {
        type: 'calendar',
        icon: CalendarIcon,
        label: 'Calendar',
        accent: 'pink',
      },
    ],
  },
];

function createElementId() {
  return `element-${Date.now()}-${Math.random()}`;
}

export function isLayoutElement(type: ElementType) {
  return type === 'flex' || type === 'grid';
}

export function createEditorElement(
  type: ElementType,
  columnCount?: number,
): EditorElement {
  const baseElement: EditorElement = {
    id: createElementId(),
    type,
    properties: { ...DEFAULT_PROPERTIES },
  };

  if (type === 'heading') {
    return {
      ...baseElement,
      content: 'Heading Text',
      properties: { ...baseElement.properties, fontSize: '32' },
    };
  }

  if (type === 'text') {
    return { ...baseElement, content: 'Click to edit this text...' };
  }

  if (type === 'wysiwyg') {
    return {
      ...baseElement,
      content: '<p>Start writing your content here...</p>',
    };
  }

  if (type === 'image') {
    return {
      ...baseElement,
      properties: {
        ...baseElement.properties,
        imageUrl: '',
        imageWidth: '60%',
        imageHeight: 'auto',
        imageAlign: 'center',
        contentAlign: 'center',
      },
    };
  }

  if (type === 'calendar') {
    return {
      ...baseElement,
      properties: { ...baseElement.properties, contentAlign: 'center' },
    };
  }

  if (type === 'flex') {
    return {
      ...baseElement,
      children: [],
      properties: {
        ...baseElement.properties,
        width: '100%',
        padding: '0',
        columnCount: 1,
      },
    };
  }

  return {
    ...baseElement,
    children: [],
    properties: {
      ...baseElement.properties,
      columnCount: columnCount || 2,
    },
  };
}
