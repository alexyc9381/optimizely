import { screen } from '@testing-library/dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Dashboard from '../../components/Dashboard';

describe('Dashboard', () => {
  it('renders dashboard title', () => {
    render(<Dashboard data-oid='ug1dy2f' />);

    const title = screen.getByText(/AI-Powered B2B Website Optimization/i);
    expect(title).toBeDefined();
  });

  it('renders key metrics cards', () => {
    render(<Dashboard data-oid='q8yjc03' />);

    // Check for key metric cards
    expect(screen.getByText(/Total Visitors/i)).toBeDefined();
    expect(screen.getByText(/Qualified Leads/i)).toBeDefined();
    expect(screen.getByText(/Conversion Rate/i)).toBeDefined();
    expect(screen.getByText(/Revenue Impact/i)).toBeDefined();
  });

  it('renders charts section', () => {
    render(<Dashboard data-oid='j_n4t0.' />);

    // Check for charts presence
    expect(screen.getByText(/Visitor Intent Distribution/i)).toBeDefined();
    expect(screen.getByText(/Revenue Prediction Trends/i)).toBeDefined();
  });

  it('renders recent activity section', () => {
    render(<Dashboard data-oid='e067qp5' />);

    expect(screen.getByText(/Recent Activity/i)).toBeDefined();
  });
});
