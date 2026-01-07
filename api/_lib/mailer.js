import nodemailer from 'nodemailer'

export function makeTransport() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) {
    return null
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  })
}

export async function sendWelcomeEmail(toEmail) {
  try {
    const transporter = makeTransport()
    if (!transporter) {
      console.log('[mailer] SMTP not configured; skipping email to', toEmail)
      return
    }
    const from = process.env.FROM_EMAIL || 'no-reply@loadoutx.org'
    const info = await transporter.sendMail({
      from,
      to: toEmail,
      subject: 'Welcome to LoadoutX',
      text: 'Welcome to LoadoutX! You can generate meta loadouts and join the community. — Team LoadoutX',
      html: '<p>Welcome to <strong>LoadoutX</strong>! You can generate meta loadouts and join the community.</p><p>— Team LoadoutX</p>'
    })
    console.log('[mailer] Sent welcome email', info.messageId)
  } catch (err) {
    console.error('[mailer] send error:', err)
  }
}
