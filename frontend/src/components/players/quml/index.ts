// Export the refactored QumlPlayer (takes metadata prop)
export { default as QumlPlayer } from './QumlPlayer';

// Export QumlPlayerContainer (handles data fetching, takes questionSetId prop)
export { default as QumlPlayerContainer } from './QumlPlayerContainer';

// For backward compatibility with routes that expect questionSetId prop
export { default } from './QumlPlayerContainer';
