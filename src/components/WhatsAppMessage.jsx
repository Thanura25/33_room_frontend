function WhatsAppMessage({ message }) {
  return <p className="whatsapp-message-text">{message.split(/(\*[^*\n]+\*)/g).map((part, index) => part.startsWith('*') && part.endsWith('*')
    ? <strong key={index}>{part.slice(1, -1)}</strong>
    : part)}</p>
}

export default WhatsAppMessage
