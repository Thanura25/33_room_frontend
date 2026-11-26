function FeedbackBanner({ error, message }) {
  if (!error && !message) {
    return null
  }

  return (
    <section className={`feedback-banner ${error ? 'error' : 'success'}`} role={error ? 'alert' : 'status'}>
      <strong>{error ? 'Action failed' : 'Update complete'}</strong>
      <p>{error || message}</p>
    </section>
  )
}

export default FeedbackBanner
