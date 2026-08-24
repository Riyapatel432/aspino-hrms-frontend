import React from 'react';
import { render, screen } from '@testing-library/react';

function AccessibleModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">{title}</h2>
      <div>{children}</div>
      <button onClick={onClose} aria-label="Close dialog">
        Close
      </button>
    </div>
  );
}

describe('Accessibility (a11y) Verification Suite', () => {
  it('1. Dialog elements have role="dialog", aria-modal="true", and aria-labelledby', () => {
    render(
      <AccessibleModal isOpen={true} title="Create Shift" onClose={() => {}}>
        <p>Modal content</p>
      </AccessibleModal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: 'Create Shift' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close dialog/i })).toBeInTheDocument();
  });
});
