import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from './QumlEditor.module.css';

type QumlEditorProps = {
  questionSetId?: string;
};

type EditorStatus = 'loading' | 'ready' | 'error';

// Track if styles have been loaded to prevent duplicate loading
let stylesLoaded = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fancytreeJQuery: any = null;

/**
 * Load QUML editor styles dynamically (only once)
 * Prevents unnecessary CSS loading if no QUML editor is used on the page
 */
const loadQumlEditorStyles = (): void => {
  const existingStyles = document.querySelector('[data-quml-editor-styles="true"]');
  if (existingStyles || stylesLoaded) {
    stylesLoaded = true;
    return;
  }

  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = '/assets/quml-editor/styles.css';
  styleLink.setAttribute('data-quml-editor-styles', 'true');
  document.head.appendChild(styleLink);
  stylesLoaded = true;
};

/**
 * Load jQuery Fancytree for the editor (required dependency)
 */
const loadFancytreeLocally = async (): Promise<void> => {
  if (window.$ && (window.$ as any).fn && (window.$ as any).fn.fancytree) {
    return;
  }

  // Dynamically import jQuery and Fancytree
  const { default: jq } = await import('jquery');
  window.$ = jq;
  (window as any).jQuery = jq;

  // Load Fancytree and its extensions
  // @ts-expect-error - No type definitions available for jquery.fancytree
  await import('jquery.fancytree');
  // @ts-expect-error - No type definitions available for jquery.fancytree/glyph
  await import('jquery.fancytree/dist/modules/jquery.fancytree.glyph.js');
  // @ts-expect-error - No type definitions available for jquery.fancytree/dnd5
  await import('jquery.fancytree/dist/modules/jquery.fancytree.dnd5.js');
};

/**
 * Wait for Fancytree to be available on window
 */
const waitForFancytree = async (retries = 20, delayMs = 150): Promise<boolean> => {
  for (let i = 0; i < retries; i += 1) {
    const jq = (window as any).$ || (window as any).jQuery;
    if (jq && jq.fn && jq.fn.fancytree) {
      window.$ = jq;
      (window as any).jQuery = jq;
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
};

/**
 * QUML Editor Component
 * Integrates Sunbird QUML questionset editor web component
 */
const QumlEditor: React.FC<QumlEditorProps> = ({ questionSetId }) => {
  const { questionSetId: routeQuestionSetId } = useParams<{ questionSetId?: string }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<EditorStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const editorElementRef = useRef<HTMLElement | null>(null);
  const fancytreeGuardRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const contentId = routeQuestionSetId || questionSetId || 'do_123';

  useEffect(() => {
    let isCleanedUp = false;

    const handleEditorEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('QUML Editor Event:', customEvent.detail || event);
      
      // Handle different editor events
      if (customEvent.detail?.action === 'backContent') {
        // Navigate back to content list
        console.log('Back to content');
      } else if (customEvent.detail?.action === 'submitContent') {
        // Handle content submission
        console.log('Content submitted:', customEvent.detail);
      }
    };

    const mountEditor = async () => {
      try {
        // Note: Editor styles should be loaded via link tag in index.html when package is available
        // For now, editor package is not installed, so this component won't work until:
        // 1. @project-sunbird/lib-questionset-editor package is published and installed
        // 2. Assets are copied via copy-assets.js postinstall script
        // 3. Script tag is uncommented in index.html

        // Ensure reflect-metadata is available
        if (!(window as any).Reflect || !(window as any).Reflect.getMetadata) {
          await import('reflect-metadata');
        }

        // Prevent duplicate registration
        if (!(window as any).sunbirdQumlPlayerReady && customElements.get('sunbird-quml-player')) {
          (window as any).sunbirdQumlPlayerReady = true;
        }

        // Load Fancytree
        await loadFancytreeLocally();
        fancytreeJQuery = (window as any).$ || (window as any).jQuery;

        const fancytreeReady = await waitForFancytree();
        if (!fancytreeReady) {
          throw new Error('jQuery Fancytree not available');
        }

        // Restore Fancytree-enabled jQuery when player component registers
        customElements.whenDefined('sunbird-quml-player').then(() => {
          if (fancytreeJQuery) {
            window.$ = fancytreeJQuery;
            (window as any).jQuery = fancytreeJQuery;
          }
        }).catch(() => {});

        // Create editor configuration (hardcoded for now)
        const editorConfig = {
          context: {
            identifier: contentId,
            channel: '0144880972895272960',
            authToken: '',
            sid: 'session-123',
            did: 'device-123',
            uid: 'user-123',
            additionalCategories: [],
            host: window.location.origin,
            pdata: {
              id: 'sunbird.portal',
              ver: '7.0.0',
              pid: 'sunbird-portal'
            },
            actor: {
              id: 'user-123',
              type: 'User'
            },
            tags: [],
            defaultLicense: 'CC BY 4.0',
            endpoint: '/data/v3/telemetry',
            env: 'questionset_editor',
            user: {
              id: 'user-123',
              orgIds: ['0144880972895272960'],
              organisations: {},
              fullName: 'Test User',
              firstName: 'Test',
              lastName: 'User'
            }
          },
          config: {
            mode: 'edit',
            primaryCategory: 'Practice Question Set',
            objectType: 'QuestionSet',
            showAddCollaborator: false,
            questionSet: {
              maxQuestionsLimit: 500
            }
          }
        };

        if (isCleanedUp) return;

        // Create editor element
        const editorElement = document.createElement('lib-questionset-editor');
        editorElement.setAttribute('editor-config', JSON.stringify(editorConfig));
        editorElement.addEventListener('editorEmitter', handleEditorEvent);

        editorElementRef.current = editorElement;

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(editorElement);
        }

        setStatus('ready');

        // Guard: Restore Fancytree if it gets overwritten
        fancytreeGuardRef.current = setInterval(async () => {
          const jq = (window as any).$ || (window as any).jQuery;
          if (!jq || !jq.fn || !jq.fn.fancytree) {
            try {
              const base = fancytreeJQuery || jq;
              window.$ = base;
              (window as any).jQuery = base;
              // @ts-expect-error - No type definitions available for jquery.fancytree
              await import('jquery.fancytree');
              // @ts-expect-error - No type definitions available for jquery.fancytree/glyph
              await import('jquery.fancytree/dist/modules/jquery.fancytree.glyph.js');
              // @ts-expect-error - No type definitions available for jquery.fancytree/dnd5
              await import('jquery.fancytree/dist/modules/jquery.fancytree.dnd5.js');
            } catch (e) {
              console.warn('Failed to restore FancyTree', e);
            }
          }
        }, 800);

      } catch (error: any) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.error('Failed to bootstrap QUML editor', error);
        setErrorMessage(error.message || 'Unknown error');
        setStatus('error');
      }
    };

    mountEditor();

    return () => {
      isCleanedUp = true;
      
      if (fancytreeGuardRef.current) {
        clearInterval(fancytreeGuardRef.current);
        fancytreeGuardRef.current = null;
      }

      if (editorElementRef.current) {
        editorElementRef.current.removeEventListener('editorEmitter', handleEditorEvent);
        if (editorElementRef.current.parentNode) {
          editorElementRef.current.parentNode.removeChild(editorElementRef.current);
        }
        editorElementRef.current = null;
      }
    };
  }, [contentId]);

  return (
    <div className={styles.qumlEditorPage}>
      <section className={styles.qumlEditorHeader}>
        <h2>QUML Questionset Editor</h2>
        <p>Create and edit question sets using the Sunbird QUML editor</p>
      </section>

      {status === 'loading' && (
        <div className={styles.qumlEditorStatus}>
          Loading editor assets...
        </div>
      )}

      {status === 'error' && (
        <div className={`${styles.qumlEditorStatus} ${styles.qumlEditorStatusError}`}>
          Failed to load editor: {errorMessage}
        </div>
      )}

      <div className={styles.qumlEditorHost} ref={containerRef} />
    </div>
  );
};

export default QumlEditor;
