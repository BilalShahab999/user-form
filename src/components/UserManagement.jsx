import React, { useMemo, useState, useEffect } from 'react'
import { Formik, Field, Form, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import '../styles/UserManagement.css'

const initialForm = {
  firstName: '',
  lastName: '',
  age: 18,
  gender: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

const validationSchema = Yup.object({
  firstName: Yup.string().trim().required('Required'),
  lastName: Yup.string().trim().required('Required'),
  age: Yup.number().min(18, 'Minimum age is 18').max(60, 'Maximum age is 60').required('Required'),
  gender: Yup.string().oneOf(['male', 'female', 'other']).required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  phone: Yup.string()
    .matches(/^\+?[0-9\-\s]{7,20}$/, 'Invalid phone')
    .required('Required'),
  password: Yup.string().min(8, 'Minimum 8 characters').required('Required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Required'),
})

function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div className="ums-modal" role="dialog" aria-modal="true">
      <div className="ums-modal-backdrop" onClick={onClose} />
      <div className="ums-modal-content">
        <button className="ums-modal-close" onClick={onClose} aria-label="Close">×</button>
        {children}
      </div>
    </div>
  )
}

// Load users from localStorage exactly once, synchronously, before the first
// render. This avoids the load/save race that a useEffect-based load causes.
function loadUsersFromStorage() {
  try {
    const raw = localStorage.getItem('ums_users')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (e) {
    // ignore corrupted/inaccessible storage
  }
  return []
}

export default function UserManagement() {
  const [users, setUsers] = useState(loadUsersFromStorage)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [ageRange, setAgeRange] = useState([18, 60])

  const addUser = (values, actions) => {
    const saved = { ...values }
    delete saved.password
    delete saved.confirmPassword
    setUsers((s) => [saved, ...s])
    actions.resetForm()
    setIsOpen(false)
  }

  // persist users whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('ums_users', JSON.stringify(users))
    } catch (e) {}
  }, [users])

  const minAge = 18
  const maxAge = 60

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      const ageOk = u.age >= ageRange[0] && u.age <= ageRange[1]
      if (!ageOk) return false
      if (!q) return true
      return (
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        String(u.age).includes(q) ||
        (u.gender || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q)
      )
    })
  }, [users, query, ageRange])

  return (
    <div className="ums-container">
      <div className="ums-card">
      <header className="ums-header">
        <div>
          <h1>User Management</h1>
        </div>
        <div className="ums-actions">
          <div className="ums-search">
            <input
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="ums-add" onClick={() => setIsOpen(true)}>
            + Add User
          </button>
        </div>
      </header>

      <section className="ums-filters">
        <label className="ums-age-label">Allowed age: {ageRange[0]} - {ageRange[1]}</label>
      </section>

      <section className="ums-table-wrap">
        <table className="ums-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="ums-empty">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((u, i) => (
                <tr key={i}>
                  <td>{u.firstName} {u.lastName}</td>
                  <td>{u.age}</td>
                  <td>{u.gender}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <div className="ums-modal-body">
          <h2>Add User</h2>
          <Formik
            initialValues={initialForm}
            validationSchema={validationSchema}
            onSubmit={addUser}
          >
            {({ values, setFieldValue }) => (
              <Form className="ums-form">
                <div className="ums-row">
                  <label>
                    First name
                    <Field name="firstName" />
                    <ErrorMessage name="firstName" component="div" className="ums-error" />
                  </label>
                  <label>
                    Last name
                    <Field name="lastName" />
                    <ErrorMessage name="lastName" component="div" className="ums-error" />
                  </label>
                </div>

                <div className="ums-row">
                  <label>
                    Age
                    <Field name="age" type="number" min={minAge} max={maxAge} />
                    <ErrorMessage name="age" component="div" className="ums-error" />
                  </label>
                  <label>
                    Gender
                    <Field as="select" name="gender">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </Field>
                    <ErrorMessage name="gender" component="div" className="ums-error" />
                  </label>
                </div>

                <div className="ums-row">
                  <label>
                    Email
                    <Field name="email" type="email" />
                    <ErrorMessage name="email" component="div" className="ums-error" />
                  </label>
                  <label>
                    Phone
                    <Field name="phone" />
                    <ErrorMessage name="phone" component="div" className="ums-error" />
                  </label>
                </div>

                <div className="ums-row">
                  <label>
                    Password
                    <Field name="password" type="password" />
                    <ErrorMessage name="password" component="div" className="ums-error" />
                  </label>
                  <label>
                    Confirm
                    <Field name="confirmPassword" type="password" />
                    <ErrorMessage name="confirmPassword" component="div" className="ums-error" />
                  </label>
                </div>

                <div className="ums-modal-actions">
                  <button type="button" className="ums-cancel" onClick={() => setIsOpen(false)}>Cancel</button>
                  <button type="submit" className="ums-submit">Save User</button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </Modal>
      </div>
    </div>
  )
}