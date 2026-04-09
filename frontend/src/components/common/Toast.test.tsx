import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastTitle,
  ToastDescription,
  ToastViewport,
  ToastProvider,
} from './Toast';

function renderInProvider(ui: React.ReactNode) {
  return render(
    <ToastProvider>
      {ui}
      <ToastViewport />
    </ToastProvider>,
  );
}

describe('Toast', () => {
  it('renders children inside ToastProvider', () => {
    renderInProvider(
      <Toast open>
        <span>Toast Content</span>
      </Toast>,
    );
    expect(screen.getByText('Toast Content')).toBeInTheDocument();
  });

  it('applies destructive variant class', () => {
    renderInProvider(
      <Toast open variant="destructive" data-testid="toast-destructive">
        Destructive Toast
      </Toast>,
    );
    const toastEl = screen.getByText('Destructive Toast').closest('[data-state]');
    expect(toastEl?.className).toMatch(/destructive/);
  });

  it('applies success variant class', () => {
    renderInProvider(
      <Toast open variant="success" data-testid="toast-success">
        Success Toast
      </Toast>,
    );
    const toastEl = screen.getByText('Success Toast').closest('[data-state]');
    expect(toastEl?.className).toMatch(/success/);
  });
});

describe('ToastTitle', () => {
  it('renders text', () => {
    renderInProvider(
      <Toast open>
        <ToastTitle>My Toast Title</ToastTitle>
      </Toast>,
    );
    expect(screen.getByText('My Toast Title')).toBeInTheDocument();
  });
});

describe('ToastDescription', () => {
  it('renders text', () => {
    renderInProvider(
      <Toast open>
        <ToastDescription>My Toast Description</ToastDescription>
      </Toast>,
    );
    expect(screen.getByText('My Toast Description')).toBeInTheDocument();
  });
});

describe('ToastClose', () => {
  it('renders with FiX icon', () => {
    renderInProvider(
      <Toast open>
        <ToastClose />
      </Toast>,
    );
    // ToastClose renders a button with an svg icon (FiX)
    const closeBtn = document.querySelector('[toast-close]');
    expect(closeBtn).toBeInTheDocument();
    // SVG icon should be present
    expect(closeBtn?.querySelector('svg')).toBeInTheDocument();
  });
});

describe('ToastViewport', () => {
  it('renders', () => {
    render(
      <ToastProvider>
        <ToastViewport data-testid="toast-viewport" />
      </ToastProvider>,
    );
    // Viewport is rendered in the DOM (may be in a portal)
    const viewport = document.querySelector('[data-radix-toast-viewport]') ?? document.querySelector('[data-testid="toast-viewport"]');
    expect(viewport).toBeInTheDocument();
  });
});

describe('ToastAction', () => {
  it('renders with altText prop', () => {
    renderInProvider(
      <Toast open>
        <ToastAction altText="Undo action">Undo</ToastAction>
      </Toast>,
    );
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });
});
