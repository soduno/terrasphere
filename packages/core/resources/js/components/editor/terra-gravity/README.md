# TerraGravity

TerraGravity is TerraSphere's pointer-based drag/drop engine. It replaces the
browser's HTML5 drag API for internal editor interactions and owns one drag
session per editor.

- a movement threshold so normal clicks remain clicks;
- pointer capture so a drag survives leaving its source element;
- registered, typed sources and targets;
- DOM hit-testing with the deepest compatible target taking precedence;
- a single visual drag preview;
- edge scrolling for scrollable editor panels;
- Escape and pointer-cancel cleanup;
- click suppression after a completed drag; and
- a context identity that survives Vite hot reload.

Editor interactions are represented by the `EditorDragPayload` union. New
interaction types should be added there and handled through
`useGravitySource` and `useGravityTarget`.

Files dragged in from the operating system intentionally use native
`dragenter`, `dragover`, and `drop` events. External file transfer and internal
editor reordering are separate systems so the browser never treats an internal
element as a downloadable file or navigates to a dropped image.
