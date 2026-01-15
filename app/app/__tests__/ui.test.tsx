import React from 'react';
import { render } from '@testing-library/react-native';
import Index from '../index';

// Feature: focus-timer, Property 15: Required UI elements present
// Validates: Requirements 7.3, 6.5
describe('UI Rendering', () => {
  it('should render all required UI elements', () => {
    const { getByText } = render(<Index />);
    
    // Check for timer display (should show initial time 25:00)
    expect(getByText('25:00')).toBeTruthy();
    
    // Check for Start button (initial state is stopped)
    expect(getByText('Start')).toBeTruthy();
    
    // Check for streak counter (should contain "Streak:")
    expect(getByText(/Streak:/)).toBeTruthy();
  });
});
