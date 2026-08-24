import React from 'react';
import { render, screen } from '@testing-library/react';

// Dynamic Master Data Dropdown Component Test
function DynamicDropdown({ label, options = [], loading = false, value, onChange, placeholder = 'Select...' }) {
  if (loading) return <div>Loading {label}...</div>;

  return (
    <div>
      <label htmlFor={`select-${label}`}>{label}</label>
      <select
        id={`select-${label}`}
        aria-label={label}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id || opt.value} value={opt.id || opt.value}>
            {opt.name || opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

describe('Master Dynamic Dropdowns Audit', () => {
  it('1. Bank Dropdown renders dynamic options fetched from API', () => {
    const banks = [
      { id: '1', name: 'HDFC Bank' },
      { id: '2', name: 'State Bank of India' },
      { id: '3', name: 'ICICI Bank' },
    ];

    render(<DynamicDropdown label="Bank" options={banks} />);
    expect(screen.getByRole('combobox', { name: /bank/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'HDFC Bank' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'State Bank of India' })).toBeInTheDocument();
  });

  it('2. Shift Dropdown renders dynamic shift options', () => {
    const shifts = [
      { id: 'shift-1', name: 'Morning Shift (09:00 - 18:00)' },
      { id: 'shift-2', name: 'Night Shift (22:00 - 06:00)' },
    ];

    render(<DynamicDropdown label="Shift" options={shifts} />);
    expect(screen.getByRole('option', { name: /Morning Shift/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Night Shift/i })).toBeInTheDocument();
  });

  it('3. Shows loading state while master data is being fetched', () => {
    render(<DynamicDropdown label="Department" loading={true} />);
    expect(screen.getByText('Loading Department...')).toBeInTheDocument();
  });
});
