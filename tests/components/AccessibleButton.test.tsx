import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AccessibleButton } from '../../src/components/common/AccessibleButton';

describe('AccessibleButton Component', () => {
  it('renders with accessibility label and button role', async () => {
    const onPressMock = jest.fn();
    const { getByRole, getByText } = await render(
      <AccessibleButton
        label="Test Action"
        accessibilityHint="Tap to perform test action"
        onPress={onPressMock}
      />
    );

    const button = getByRole('button');
    expect(button).toBeTruthy();
    expect(getByText('Test Action')).toBeTruthy();
  });

  it('calls onPress when tapped', async () => {
    const onPressMock = jest.fn();
    const { getByRole } = await render(
      <AccessibleButton label="Click Me" onPress={onPressMock} />
    );

    fireEvent.press(getByRole('button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not trigger onPress when disabled', async () => {
    const onPressMock = jest.fn();
    const { getByRole } = await render(
      <AccessibleButton label="Disabled" onPress={onPressMock} disabled={true} />
    );

    fireEvent.press(getByRole('button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });
});
