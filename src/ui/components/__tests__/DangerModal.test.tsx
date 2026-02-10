import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DangerModal } from '../DangerModal';

describe('DangerModal', () => {
  it('no debe renderizar si no hay resultado', () => {
    const { container } = render(<DangerModal result={null} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('no debe renderizar si el resultado no es vulnerable', () => {
    const { container } = render(
      <DangerModal
        result={{ vulnerable: false, message: 'ok' }}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('debe renderizar credenciales y cerrar modal', () => {
    const onClose = vi.fn();
    render(
      <DangerModal
        result={{ vulnerable: true, credentials_found: 'admin:1234', message: 'pwned' }}
        onClose={onClose}
      />
    );

    expect(screen.getByText(/CRITICAL VULNERABILITY/)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('admin') && content.includes('1234'))).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /ACKNOWLEDGE THREAT/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
