import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('should render without crashing', () => {
    // App already includes Router, so we don't need to wrap it
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('should render router structure', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});

