import React, { useState, useMemo } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Paginated Table Component for Large Datasets
function LargeDatasetTable({ items = [], pageSize = 10 }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [items, searchTerm]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  return (
    <div>
      <input
        placeholder="Search 10,000 records..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
      />
      <span data-testid="total-count">Total: {filteredItems.length}</span>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {paginatedItems.map((item) => (
            <tr key={item.id} data-testid="table-row">
              <td>{item.id}</td>
              <td>{item.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span data-testid="current-page">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

describe('Frontend Large Dataset (Thousands of Records) Handling', () => {
  // Generate 5,000 records
  const thousandsOfRecords = Array.from({ length: 5000 }).map((_, i) => ({
    id: `EMP-${i + 1}`,
    name: `Employee Full Name ${i + 1}`,
  }));

  it('1. Renders only page-size (10) DOM elements when given 5,000 records, preventing DOM bloat', () => {
    render(<LargeDatasetTable items={thousandsOfRecords} pageSize={10} />);

    // Check that total shows 5,000 records
    expect(screen.getByTestId('total-count')).toHaveTextContent('Total: 5000');
    // Check that exactly 10 rows are rendered in the DOM
    const renderedRows = screen.getAllByTestId('table-row');
    expect(renderedRows).toHaveLength(10);
    expect(screen.getByText('Employee Full Name 1')).toBeInTheDocument();
    expect(screen.getByTestId('current-page')).toHaveTextContent('Page 1 of 500');
  });

  it('2. Navigating to Next Page renders next slice without re-mounting all records', () => {
    render(<LargeDatasetTable items={thousandsOfRecords} pageSize={10} />);

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByTestId('current-page')).toHaveTextContent('Page 2 of 500');
    expect(screen.getByText('Employee Full Name 11')).toBeInTheDocument();
    expect(screen.queryByText('Employee Full Name 1')).not.toBeInTheDocument();
  });

  it('3. Instant search filtering across 5,000 items efficiently recalculates pagination', () => {
    render(<LargeDatasetTable items={thousandsOfRecords} pageSize={10} />);

    const searchInput = screen.getByPlaceholderText(/search 10,000 records/i);
    fireEvent.change(searchInput, { target: { value: 'Employee Full Name 499' } });

    // Should find matching subset (e.g. 499, 4990, 4991, ...)
    const rows = screen.getAllByTestId('table-row');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(10);
  });
});
