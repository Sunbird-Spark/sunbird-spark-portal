import React from 'react';

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'sunbird-quml-player': any;
        }
    }
}
