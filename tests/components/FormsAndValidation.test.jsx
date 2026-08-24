import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

function EmployeeForm({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!email) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Invalid email address';
    }

    if (!phone) {
      errs.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phone)) {
      errs.phone = 'Phone must be exactly 10 digits';
    }

    if (salary && Number(salary) < 0) {
      errs.salary = 'Salary cannot be negative';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit && onSubmit({ email, phone, salary });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <span role="alert">{errors.email}</span>}
      </div>

      <div>
        <label htmlFor="phone">Phone</label>
        <input
          id="phone"
          name="phone"
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {errors.phone && <span role="alert">{errors.phone}</span>}
      </div>

      <div>
        <label htmlFor="salary">Salary</label>
        <input
          id="salary"
          name="salary"
          type="number"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
        />
        {errors.salary && <span role="alert">{errors.salary}</span>}
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}

describe('Forms and Validation Suite', () => {
  it('1. Required field validations trigger when fields are empty', () => {
    render(<EmployeeForm />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Phone number is required')).toBeInTheDocument();
  });

  it('2. Invalid email format shows validation error', () => {
    render(<EmployeeForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
  });

  it('3. Invalid phone format shows validation error', () => {
    render(<EmployeeForm />);
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByText('Phone must be exactly 10 digits')).toBeInTheDocument();
  });

  it('4. Negative number is rejected for salary', () => {
    render(<EmployeeForm />);
    fireEvent.change(screen.getByLabelText(/salary/i), { target: { value: '-500' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByText('Salary cannot be negative')).toBeInTheDocument();
  });

  it('5. Valid submission calls onSubmit callback', () => {
    const handleSubmit = jest.fn();
    render(<EmployeeForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@aspino.com' } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByLabelText(/salary/i), { target: { value: '75000' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'john@aspino.com',
      phone: '9876543210',
      salary: '75000',
    });
  });
});
