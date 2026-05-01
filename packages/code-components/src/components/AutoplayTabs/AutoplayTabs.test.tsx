import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AutoplayTabs from './AutoplayTabs';

describe('AutoplayTabs', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the default tabs and images', () => {
    render(<AutoplayTabs />);

    expect(screen.getByRole('button', { name: /tab 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tab 2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tab 3/i })).toBeInTheDocument();
    expect(screen.getAllByAltText(/tab \d content/i)).toHaveLength(6);
  });

  it('switches active tab when clicked', async () => {
    const user = userEvent.setup();
    render(<AutoplayTabs />);

    await user.click(screen.getByRole('button', { name: /tab 2/i }));

    expect(screen.getByRole('button', { name: /tab 2/i })).toHaveClass('active');
    expect(screen.getByRole('button', { name: /tab 1/i })).not.toHaveClass('active');
  });

  it('advances tabs on an autoplay timer', () => {
    vi.useFakeTimers();
    render(<AutoplayTabs autoplay autoplayDuration={1000} />);

    expect(screen.getByRole('button', { name: /tab 1/i })).toHaveClass('active');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole('button', { name: /tab 2/i })).toHaveClass('active');
  });

  it('cleans up the autoplay timer on unmount', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const { unmount } = render(<AutoplayTabs autoplay autoplayDuration={1000} />);

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
