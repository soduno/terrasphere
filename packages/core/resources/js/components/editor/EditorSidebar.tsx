import { Type, AlignLeft, FileText, Image, Calendar as CalendarIcon, Layout, Grid3x3 } from 'lucide-react';
import { useDrag } from 'react-dnd';
import { EditorElement, DEFAULT_PROPERTIES } from './ElementTypes';

interface EditorSidebarProps {
  onAddElement: (element: EditorElement) => void;
  showGridModal: () => void;
  hasContainerElements: boolean;
}

const elementGroups = [
  {
    title: 'Layout',
    elements: [
      { 
        type: 'flex' as const, 
        icon: Layout, 
        label: 'Flex Container',
        color: 'indigo'
      },
      { 
        type: 'grid' as const, 
        icon: Grid3x3, 
        label: 'Grid Container',
        color: 'indigo'
      },
    ],
  },
  {
    title: 'Content',
    elements: [
      { 
        type: 'heading' as const, 
        icon: Type, 
        label: 'Heading',
        color: 'purple'
      },
      { 
        type: 'text' as const, 
        icon: AlignLeft, 
        label: 'Text',
        color: 'purple'
      },
      { 
        type: 'wysiwyg' as const, 
        icon: FileText, 
        label: 'Rich Text',
        color: 'purple'
      },
    ],
  },
  {
    title: 'Media',
    elements: [
      { 
        type: 'image' as const, 
        icon: Image, 
        label: 'Image',
        color: 'pink'
      },
      { 
        type: 'calendar' as const, 
        icon: CalendarIcon, 
        label: 'Calendar',
        color: 'pink'
      },
    ],
  },
];

export function EditorSidebar({ onAddElement, showGridModal, hasContainerElements }: EditorSidebarProps) {
  const createElement = (type: EditorElement['type'], columnCount?: number): EditorElement => {
    const baseElement: EditorElement = {
      id: `element-${Date.now()}`,
      type,
      properties: { ...DEFAULT_PROPERTIES },
    };

    switch (type) {
      case 'heading':
        return {
          ...baseElement,
          content: 'Heading Text',
          properties: { ...baseElement.properties, fontSize: '32' },
        };
      case 'text':
        return {
          ...baseElement,
          content: 'Click to edit this text...',
        };
      case 'wysiwyg':
        return {
          ...baseElement,
          content: '<p>Start writing your content here...</p>',
        };
      case 'image':
        return {
          ...baseElement,
          properties: { 
            ...baseElement.properties, 
            imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
            imageWidth: '100%',
            imageHeight: 'auto',
          },
        };
      case 'calendar':
        return {
          ...baseElement,
          properties: {
            ...baseElement.properties,
            contentAlign: 'center',
          },
        };
      case 'flex':
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
      case 'grid':
        return {
          ...baseElement,
          children: [],
          properties: {
            ...baseElement.properties,
            columnCount: columnCount || 2,
          },
        };
      default:
        return baseElement;
    }
  };

  return (
    <div className="w-[280px] bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 overflow-y-auto shadow-sm">
      <div className="p-6 space-y-6">
        {elementGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-3 tracking-wider">
              {group.title}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {group.elements.map((element) => {
                const isLayout = element.type === 'flex' || element.type === 'grid';
                const shouldBlur = !hasContainerElements && !isLayout;
                
                return (
                  <DraggableElementButton
                    key={element.type}
                    element={element}
                    onCreate={createElement}
                    onAddElement={onAddElement}
                    showGridModal={showGridModal}
                    shouldBlur={shouldBlur}
                    hasContainerElements={hasContainerElements}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
        <h3 className="text-xs text-gray-900 dark:text-white mb-2">Quick Tips</h3>
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <p>• Drag layout containers first</p>
          <p>• Add elements into containers</p>
          <p>• Double-click text to edit</p>
          <p>• Use properties panel to style</p>
        </div>
      </div>
    </div>
  );
}

interface DraggableElementButtonProps {
  element: {
    type: EditorElement['type'];
    icon: any;
    label: string;
    color: string;
  };
  onCreate: (type: EditorElement['type'], columnCount?: number) => EditorElement;
  onAddElement: (element: EditorElement) => void;
  showGridModal: () => void;
  shouldBlur: boolean;
  hasContainerElements: boolean;
}

function DraggableElementButton({ element, onCreate, onAddElement, showGridModal, shouldBlur, hasContainerElements }: DraggableElementButtonProps) {
  const isLayout = element.type === 'flex' || element.type === 'grid';
  
  const [{ isDragging }, drag] = useDrag({
    type: 'new-element',
    item: () => ({
      elementType: element.type,
      createElement: (columnCount?: number) => onCreate(element.type, columnCount),
      isLayout,
    }),
    canDrag: () => isLayout || hasContainerElements,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleClick = () => {
    // Only allow clicking layout elements from sidebar
    // Non-layout elements must be dragged into containers
    if (!isLayout) {
      return; // Prevent clicking non-layout elements
    }
    
    if (element.type === 'grid') {
      showGridModal();
    } else {
      onAddElement(onCreate(element.type));
    }
  };

  return (
    <button
      ref={(node) => {
        drag(node);
      }}
      onClick={handleClick}
      disabled={shouldBlur}
      className={`group flex flex-col items-center justify-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-${element.color}-400 dark:hover:border-${element.color}-500 hover:bg-${element.color}-50/50 dark:hover:bg-${element.color}-950/30 transition-all hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      } ${
        shouldBlur ? 'blur-sm opacity-40 cursor-not-allowed hover:scale-100' : ''
      }`}
    >
      <element.icon className={`w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-${element.color}-600 dark:group-hover:text-${element.color}-400 mb-2 transition-colors`} />
      <span className={`text-xs text-gray-700 dark:text-gray-300 group-hover:text-${element.color}-700 dark:group-hover:text-${element.color}-400 text-center`}>
        {element.label}
      </span>
    </button>
  );
}
