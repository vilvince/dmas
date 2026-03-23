import { NextResponse } from 'next/server'
import { sendDocumentNotification } from '@/lib/email/send-notification'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, senderName, senderEmail, recipientName, documentName, documentType, action } = body

    if (!to || !documentName || !action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const result = await sendDocumentNotification({
      to, senderName, senderEmail, recipientName, documentName, documentType, action,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
}