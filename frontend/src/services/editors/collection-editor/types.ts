// Types for the collection editor service layer.
// IEditorConfig and ToolbarAction are imported directly from @project-sunbird/collection-editor-react
// wherever needed — no local re-export required.

export interface CollectionEditorContextProps {
  mode: string;
  objectType?: string;
  primaryCategory?: string;
}
