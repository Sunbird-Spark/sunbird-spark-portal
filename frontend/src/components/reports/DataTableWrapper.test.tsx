import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataTableWrapper, { type Column } from './DataTableWrapper';

interface Row {
  id: string;
  name: string;
  score: number;
}

const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'score', header: 'Score', sortable: true, className: 'text-right' },
];

const data: Row[] = [
  { id: '1', name: 'Alice', score: 90 },
  { id: '2', name: 'Bob', score: 75 },
  { id: '3', name: 'Charlie', score: 85 },
];

describe('DataTableWrapper', () => {
  it('renders column headers', () => {
    render(<DataTableWrapper columns={columns} data={data} keyExtractor={(r) => r.id} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  it('renders all rows', () => {
    render(<DataTableWrapper columns={columns} data={data} keyExtractor={(r) => r.id} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('renders empty message when data is empty', () => {
    render(<DataTableWrapper columns={columns} data={[]} keyExtractor={(r) => r.id} />);
    expect(screen.getByText('No data available.')).toBeInTheDocument();
  });

  it('renders custom empty message', () => {
    render(
      <DataTableWrapper columns={columns} data={[]} keyExtractor={(r) => r.id} emptyMessage="Nothing here." />
    );
    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    const { container } = render(
      <DataTableWrapper columns={columns} data={data} keyExtractor={(r) => r.id} loading />
    );
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('sorts ascending by name column on first click', () => {
    render(<DataTableWrapper columns={columns} data={data} keyExtractor={(r) => r.id} />);
    fireEvent.click(screen.getByText('Name'));
    const cells = screen.getAllByRole('cell');
    // first data cell should be Alice (ascending)
    expect(cells[0]).toHaveTextContent('Alice');
  });

  it('sorts descending by name column on second click', () => {
    render(<DataTableWrapper columns={columns} data={data} keyExtractor={(r) => r.id} />);
    fireEvent.click(screen.getByText('Name'));
    fireEvent.click(screen.getByText('Name'));
    const cells = screen.getAllByRole('cell');
    // first data cell should be Charlie (descending)
    expect(cells[0]).toHaveTextContent('Charlie');
  });

  it('sorts by numeric score column', () => {
    render(<DataTableWrapper columns={columns} data={data} keyExtractor={(r) => r.id} />);
    fireEvent.click(screen.getByText('Score'));
    const cells = screen.getAllByRole('cell');
    // ascending: Bob (75), Charlie (85), Alice (90)
    expect(cells[1]).toHaveTextContent('75');
  });

  it('renders custom cell renderer', () => {
    const cols: Column<Row>[] = [
      { key: 'name', header: 'Name' },
      {
        key: 'score',
        header: 'Score',
        render: (row) => <span data-testid={`score-${row.id}`}>{row.score}</span>,
      },
    ];
    render(<DataTableWrapper columns={cols} data={data} keyExtractor={(r) => r.id} />);
    expect(screen.getByTestId('score-1')).toBeInTheDocument();
  });

  it('shows pagination when data exceeds pageSize', () => {
    const bigData = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      name: `User ${i}`,
      score: i * 10,
    }));
    render(<DataTableWrapper columns={columns} data={bigData} keyExtractor={(r) => r.id} pageSize={5} />);
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
  });

  it('does not show pagination when data fits on one page', () => {
    render(<DataTableWrapper columns={columns} data={data} keyExtractor={(r) => r.id} pageSize={10} />);
    expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument();
  });

  it('navigates to next page', () => {
    const bigData = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      name: `User ${i}`,
      score: i * 10,
    }));
    render(<DataTableWrapper columns={columns} data={bigData} keyExtractor={(r) => r.id} pageSize={5} />);
    fireEvent.click(screen.getByLabelText('Next page'));
    expect(screen.getByText(/2 \/ /)).toBeInTheDocument();
  });

  it('navigates to last page', () => {
    const bigData = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      name: `User ${i}`,
      score: i * 10,
    }));
    render(<DataTableWrapper columns={columns} data={bigData} keyExtractor={(r) => r.id} pageSize={5} />);
    fireEvent.click(screen.getByLabelText('Last page'));
    expect(screen.getByText(/3 \/ 3/)).toBeInTheDocument();
  });

  it('navigates to first page', () => {
    const bigData = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      name: `User ${i}`,
      score: i * 10,
    }));
    render(<DataTableWrapper columns={columns} data={bigData} keyExtractor={(r) => r.id} pageSize={5} />);
    fireEvent.click(screen.getByLabelText('Last page'));
    fireEvent.click(screen.getByLabelText('First page'));
    expect(screen.getByText(/1 \/ /)).toBeInTheDocument();
  });
});
