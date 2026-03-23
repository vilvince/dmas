import { createDocumentNotifications, NotificationAction } from './notification-service'
import { sendDocumentNotification } from '@/lib/email/send-notification'
import { createClient } from '@/lib/supabase/client'

export async function sendAllNotifications({
  documentId,
  documentTitle,
  documentType,
  action,
  clientId,
  sendingOfficeId,
  receivingOfficeId,
  remarks,
}: {
  documentId: string
  documentTitle: string
  documentType: string
  action: NotificationAction
  clientId: string
  sendingOfficeId?: string
  receivingOfficeId?: string
  remarks?: string
}) {
  const supabase = createClient()

  // 1. Create in-app notifications
  await createDocumentNotifications({
    documentId,
    documentTitle,
    action,
    clientId,
    sendingOfficeId,
    receivingOfficeId,
    remarks,
  })

  // 2. Send email notifications
  try {
    // Get user details
    const { data: client } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', clientId)
      .single()

    const { data: sendingOffice } = sendingOfficeId
      ? await supabase
          .from('profiles')
          .select('email, full_name, departments ( name )')
          .eq('id', sendingOfficeId)
          .single()
      : { data: null }

    const { data: receivingOffice } = receivingOfficeId
      ? await supabase
          .from('profiles')
          .select('email, full_name, departments ( name )')
          .eq('id', receivingOfficeId)
          .single()
      : { data: null }

    // Map action to email action type
    const emailAction = mapActionToEmailAction(action)

    // Email to client
    if (client?.email) {
      await sendDocumentNotification({
        to: client.email,
        recipientName: client.full_name,
        senderName: (sendingOffice as any)?.departments?.name || 'System',
        senderEmail: sendingOffice?.email || 'noreply@buceng.edu',
        documentName: documentTitle,
        documentType,
        action: emailAction,
      })
    }

    // Email to receiving office (if document is forwarded/approved to another office)
    if (receivingOffice?.email && (action === 'document_forwarded' || action === 'document_approved' || action === 'recommended_approval')) {
      await sendDocumentNotification({
        to: receivingOffice.email,
        recipientName: receivingOffice.full_name,
        senderName: (sendingOffice as any)?.departments?.name || 'System',
        senderEmail: sendingOffice?.email || 'noreply@buceng.edu',
        documentName: documentTitle,
        documentType,
        action: 'submitted', // New document for them
      })
    }
  } catch (emailError) {
    console.error('Email notification failed:', emailError)
    // Don't throw - notifications were created successfully
  }

  return { success: true }
}

function mapActionToEmailAction(action: NotificationAction): 'submitted' | 'approved' | 'denied' | 'released' {
  const mapping = {
    document_submitted: 'submitted',
    document_received: 'submitted',
    in_process: 'submitted',
    document_approved: 'approved',
    recommended_approval: 'approved',
    document_denied: 'denied',
    document_forwarded: 'submitted',
    document_released: 'released',
  } as const

  return mapping[action] || 'submitted'
}