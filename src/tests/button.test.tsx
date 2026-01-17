import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders provided label', () => {
    render(<Button>Launch</Button>);
    expect(screen.getByRole('button', { name: 'Launch' })).toBeInTheDocument();
  });
});
