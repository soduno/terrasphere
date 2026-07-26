import type { CSSProperties } from 'react';
import type {
  EditorElement,
  ElementAlignment,
} from '../../types/editor';

export function getEditorElementStyle(
  element: EditorElement,
  defaultFontSize = 16,
): CSSProperties {
  const { properties } = element;

  return {
    paddingTop: `${properties.paddingTop ?? properties.padding ?? 0}px`,
    paddingRight: `${properties.paddingRight ?? properties.padding ?? 0}px`,
    paddingBottom: `${properties.paddingBottom ?? properties.padding ?? 0}px`,
    paddingLeft: `${properties.paddingLeft ?? properties.padding ?? 0}px`,
    marginTop: `${properties.marginTop ?? properties.margin ?? 0}px`,
    marginRight: `${properties.marginRight ?? properties.margin ?? 0}px`,
    marginBottom: `${properties.marginBottom ?? properties.margin ?? 0}px`,
    marginLeft: `${properties.marginLeft ?? properties.margin ?? 0}px`,
    backgroundColor: properties.backgroundColor || 'transparent',
    textAlign: properties.contentAlign || properties.textAlign || 'left',
    fontSize: `${properties.fontSize || defaultFontSize}px`,
    color: properties.color || '#000000',
    borderRadius: `${properties.borderRadius || 0}px`,
  };
}

export function getFlexAlignment(alignment?: ElementAlignment) {
  if (alignment === 'center') return 'center';
  if (alignment === 'right') return 'flex-end';
  return 'flex-start';
}

export function getVerticalAlignment(
  alignment: EditorElement['properties']['verticalAlign'],
) {
  if (alignment === 'center') return 'center';
  if (alignment === 'bottom') return 'flex-end';
  return 'flex-start';
}
