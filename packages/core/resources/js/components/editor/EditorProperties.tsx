import { EditorElement } from './ElementTypes';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Slider } from '../ui/slider';

interface EditorPropertiesProps {
  element: EditorElement;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
}

export function EditorProperties({ element, updateElement }: EditorPropertiesProps) {
  const handlePropertyChange = (property: string, value: string | number) => {
    updateElement(element.id, {
      properties: {
        ...element.properties,
        [property]: value,
      },
    });
  };

  const isTextElement = element.type === 'heading' || element.type === 'text' || element.type === 'wysiwyg';
  const isLayoutElement = element.type.startsWith('columns-');

  return (
    <div className="w-[320px] bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 overflow-y-auto shadow-sm">
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-sm text-gray-900 dark:text-white">Properties</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Customize your element
          </p>
        </div>

        <div className="space-y-6">
          {/* Element Type */}
          <div>
            <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2">Element</Label>
            <div className="mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-900 dark:text-white capitalize">
                {element.type.replace('-', ' ')}
              </p>
            </div>
          </div>

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Spacing */}
          <div className="space-y-4">
            <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Spacing</Label>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="padding" className="text-xs text-gray-700 dark:text-gray-300">Padding</Label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{element.properties.padding || 20}px</span>
                </div>
                <Slider
                  id="padding"
                  min={0}
                  max={100}
                  step={5}
                  value={[parseInt(element.properties.padding || '20')]}
                  onValueChange={([value]) => handlePropertyChange('padding', value.toString())}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="margin" className="text-xs text-gray-700 dark:text-gray-300">Margin</Label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{element.properties.margin || 10}px</span>
                </div>
                <Slider
                  id="margin"
                  min={0}
                  max={100}
                  step={5}
                  value={[parseInt(element.properties.margin || '10')]}
                  onValueChange={([value]) => handlePropertyChange('margin', value.toString())}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {isLayoutElement && (
            <>
              <Separator className="bg-gray-100 dark:bg-gray-800" />
              <div className="space-y-3">
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Layout</Label>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="columnGap" className="text-xs text-gray-700 dark:text-gray-300">Column Gap</Label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{element.properties.columnGap || 20}px</span>
                  </div>
                  <Slider
                    id="columnGap"
                    min={0}
                    max={60}
                    step={5}
                    value={[parseInt(element.properties.columnGap || '20')]}
                    onValueChange={([value]) => handlePropertyChange('columnGap', value.toString())}
                    className="w-full"
                  />
                </div>
              </div>
            </>
          )}

          {isTextElement && (
            <>
              <Separator className="bg-gray-100 dark:bg-gray-800" />
              <div className="space-y-4">
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Typography</Label>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="fontSize" className="text-xs text-gray-700 dark:text-gray-300">Font Size</Label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{element.properties.fontSize || 16}px</span>
                  </div>
                  <Slider
                    id="fontSize"
                    min={12}
                    max={72}
                    step={2}
                    value={[parseInt(element.properties.fontSize || '16')]}
                    onValueChange={([value]) => handlePropertyChange('fontSize', value.toString())}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="color" className="text-xs text-gray-700 dark:text-gray-300 mb-2 block">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={element.properties.color || '#000000'}
                      onChange={(e) => handlePropertyChange('color', e.target.value)}
                      className="h-10 w-16 p-1 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={element.properties.color || '#000000'}
                      onChange={(e) => handlePropertyChange('color', e.target.value)}
                      className="h-10 flex-1 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="textAlign" className="text-xs text-gray-700 dark:text-gray-300 mb-2 block">Alignment</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => handlePropertyChange('textAlign', align)}
                        className={`px-3 py-2 rounded-lg text-xs capitalize transition-all ${
                          element.properties.textAlign === align
                            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-500'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator className="bg-gray-100 dark:bg-gray-800" />

          {/* Background & Style */}
          <div className="space-y-4">
            <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Appearance</Label>
            
            <div>
              <Label htmlFor="backgroundColor" className="text-xs text-gray-700 dark:text-gray-300 mb-2 block">Background</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={element.properties.backgroundColor === 'transparent' ? '#ffffff' : element.properties.backgroundColor || '#ffffff'}
                  onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                  className="h-10 w-16 p-1 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer"
                />
                <Input
                  type="text"
                  value={element.properties.backgroundColor || 'transparent'}
                  onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                  className="h-10 flex-1 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm"
                  placeholder="transparent"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="borderRadius" className="text-xs text-gray-700 dark:text-gray-300">Border Radius</Label>
                <span className="text-xs text-gray-500 dark:text-gray-400">{element.properties.borderRadius || 0}px</span>
              </div>
              <Slider
                id="borderRadius"
                min={0}
                max={50}
                step={2}
                value={[parseInt(element.properties.borderRadius || '0')]}
                onValueChange={([value]) => handlePropertyChange('borderRadius', value.toString())}
                className="w-full"
              />
            </div>
          </div>

          {element.type === 'image' && (
            <>
              <Separator className="bg-gray-100 dark:bg-gray-800" />
              <div className="space-y-3">
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Image</Label>
                <div>
                  <Label htmlFor="imageUrl" className="text-xs text-gray-700 dark:text-gray-300 mb-2 block">Image URL</Label>
                  <Input
                    id="imageUrl"
                    type="text"
                    value={element.properties.imageUrl || ''}
                    onChange={(e) => handlePropertyChange('imageUrl', e.target.value)}
                    className="h-10 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}