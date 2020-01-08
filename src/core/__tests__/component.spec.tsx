import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

describe('core/component', () => {
  it('should test react component success', () => {
    const Text = ({ text }: { text: string }) => <span>{text}</span>;

    const { queryByText } = render(<Text text={'text'} />);

    expect(queryByText('text')).not.toBeNull();
  });
});
