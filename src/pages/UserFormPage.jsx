import { useRef, useState } from 'react'
import UiIcon from '../components/UiIcon'
import { createUserForm } from '../utils/forms'
import { validateResidentForm } from '../utils/residentValidation'

const apiFields = { name: 'fullName', room_number: 'roomNumber', phone_number: 'phone', email: 'email', birthday: 'birthday', joined_date: 'joinedDate', left_date: 'leftDate', status: 'status' }
const hints = { email: 'Optional', phone: 'WhatsApp number. Local numbers are saved with +94.', birthday: 'Optional. Member’s date of birth.', leftDate: 'Optional. Add a date when the resident leaves.' }

function FormField({ name, label, error, children }) {
  return <label className="users-field">
    <span>{label}</span>{children}
    {hints[name] && <small id={`user-${name}-hint`}>{hints[name]}</small>}
    {error && <small className="users-field-error" id={`user-${name}-error`}>{error}</small>}
  </label>
}

function UserFormPage({ user, users = [], savingUser, onSubmit, onNavigate }) {
  const [form, setForm] = useState(() => createUserForm(user))
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const formRef = useRef(null)
  const errorRef = useRef(null)

  function update(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: undefined }))
    setSubmitError('')
  }

  function showErrors(nextErrors, message) {
    setErrors(nextErrors)
    setSubmitError(message)
    requestAnimationFrame(() => {
      const field = formRef.current?.querySelector('[aria-invalid="true"]')
      if (field) field.focus()
      else errorRef.current?.focus()
    })
  }

  function fieldProps(name) {
    return {
      name, value: form[name], onChange: update,
      'aria-invalid': errors[name] ? true : undefined,
      'aria-describedby': [hints[name] && `user-${name}-hint`, errors[name] && `user-${name}-error`].filter(Boolean).join(' ') || undefined,
    }
  }

  async function submit(event) {
    event.preventDefault()
    if (savingUser) return
    const validated = validateResidentForm(form, users)
    if (Object.keys(validated.errors).length) {
      showErrors(validated.errors, 'Check the highlighted fields and try again.')
      return
    }
    setErrors({})
    setSubmitError('')
    const result = await onSubmit(event, validated.form)
    if (result?.saved) onNavigate('users')
    else {
      const message = result?.message || 'Unable to save the user. Please try again.'
      const field = apiFields[result?.field]
      showErrors(field ? { [field]: message } : {}, message)
    }
  }

  return <article className="users-card users-form-card">
    <div className="users-form-heading"><span className="users-form-icon"><UiIcon name="users" /></span><div><h2>{user ? 'User information' : 'New user information'}</h2><p>Fields marked with <span aria-hidden="true">*</span> are required.</p></div></div>
    <form ref={formRef} onSubmit={submit} noValidate>
      {submitError && <div ref={errorRef} className="users-submit-error" role="alert" tabIndex={-1}><strong>User could not be saved</strong><p>{submitError}</p></div>}
      <fieldset disabled={savingUser}>
        <legend className="users-sr-only">User information</legend>
        <div className="users-form-section"><h3>Personal details</h3><p>The resident’s name and contact information.</p><div className="users-field-grid">
          <FormField name="fullName" label="Full name" error={errors.fullName}><input required autoComplete="name" {...fieldProps('fullName')} placeholder="Nimal Perera" /></FormField>
          <FormField name="roomNumber" label="Room number" error={errors.roomNumber}><input required {...fieldProps('roomNumber')} placeholder="e.g. A-12" /></FormField>
          <FormField name="phone" label="Phone" error={errors.phone}><input required type="tel" autoComplete="tel" {...fieldProps('phone')} placeholder="0771234567" /></FormField>
          <FormField name="email" label="Email" error={errors.email}><input type="email" autoComplete="email" {...fieldProps('email')} placeholder="resident@email.com" /></FormField>
          <FormField name="birthday" label="Birthday" error={errors.birthday}><input type="date" max={new Date().toISOString().split('T')[0]} {...fieldProps('birthday')} /></FormField>
        </div></div>
        <div className="users-form-section"><h3>Stay details</h3><p>Manage their room stay and current status.</p><div className="users-field-grid">
          <FormField name="joinedDate" label="Joined date" error={errors.joinedDate}><input required type="date" {...fieldProps('joinedDate')} /></FormField>
          <FormField name="leftDate" label="Left date" error={errors.leftDate}><input type="date" min={form.joinedDate} {...fieldProps('leftDate')} /></FormField>
          <FormField name="status" label="Status" error={errors.status}><select {...fieldProps('status')}><option value="active">Active</option><option value="inactive">Inactive</option></select></FormField>
        </div></div>
        <div className="users-form-note"><UiIcon name="bill" /><p>{user ? 'These changes apply to future bills. Saved monthly bills keep their original details.' : 'After adding this user, select them when you create a monthly bill.'}</p></div>
        <div className="users-form-footer"><button className="users-button" type="button" onClick={() => onNavigate('users')}>Cancel</button><button className="users-button users-button--primary" type="submit"><UiIcon name={user ? 'check' : 'plus'} />{savingUser ? 'Saving user...' : user ? 'Save changes' : 'Add user'}</button></div>
      </fieldset>
    </form>
  </article>
}

export default UserFormPage
