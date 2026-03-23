import { createClient } from '@/lib/supabase/client'

export type NotificationAction = 
  | 'document_submitted'
  | 'document_received'
  | 'document_approved'
  | 'document_denied'
  | 'document_forwarded'
  | 'document_released'
  | 'in_process'
  | 'recommended_approval'

interface NotificationMessage {
  title: string
  message: string
}

export async function createDocumentNotifications({
  documentId,
  documentTitle,
  action,
  clientId,
  sendingOfficeId,
  receivingOfficeId,
  remarks,
}: {
  documentId: string
  documentTitle: string
  action: NotificationAction
  clientId: string
  sendingOfficeId?: string
  receivingOfficeId?: string
  remarks?: string
}) {
  const supabase = createClient()
  const notifications = []

  // Get office names
  let sendingOfficeName = 'Office'
  let receivingOfficeName = 'Office'

  if (sendingOfficeId) {
    const { data: sendingOffice } = await supabase
      .from('departments')
      .select('name')
      .eq('id', sendingOfficeId)
      .single()
    if (sendingOffice) sendingOfficeName = sendingOffice.name
  }

  if (receivingOfficeId) {
    const { data: receivingOffice } = await supabase
      .from('departments')
      .select('name')
      .eq('id', receivingOfficeId)
      .single()
    if (receivingOffice) receivingOfficeName = receivingOffice.name
  }

  // Define notification messages
  const messages: Record<NotificationAction, {
    client?: NotificationMessage
    sender?: NotificationMessage
    receiver?: NotificationMessage
  }> = {
    document_submitted: {
      client: {
        title: 'Document Submitted',
        message: `Your document "${documentTitle}" has been submitted successfully to ${receivingOfficeName}.`,
      },
      receiver: {
        title: 'New Document Arrived',
        message: `New document "${documentTitle}" has been submitted and is awaiting your action.`,
      },
    },
    in_process: {
      client: {
        title: 'Document Received',
        message: `Your document "${documentTitle}" has been received by ${sendingOfficeName} and is now being processed.`,
      },
      sender: {
        title: 'Document Marked as Received',
        message: `You marked document "${documentTitle}" as received.`,
      },
    },
    document_approved: {
      client: {
        title: 'Document Approved',
        message: `Great news! Your document "${documentTitle}" has been approved by ${sendingOfficeName}.`,
      },
      sender: {
        title: 'Document Approved',
        message: `You approved document "${documentTitle}".`,
      },
      receiver: receivingOfficeId ? {
        title: 'Approved Document Forwarded',
        message: `An approved document "${documentTitle}" has been forwarded to you from ${sendingOfficeName}.`,
      } : undefined,
    },
    recommended_approval: {
      client: {
        title: 'Document Pending Final Approval',
        message: `Your document "${documentTitle}" has been recommended for approval by ${sendingOfficeName} and is awaiting final authorization.`,
      },
      sender: {
        title: 'Document Recommended for Approval',
        message: `You recommended document "${documentTitle}" for approval.`,
      },
      receiver: receivingOfficeId ? {
        title: 'Document Awaiting Your Approval',
        message: `Document "${documentTitle}" has been recommended for approval and forwarded to you from ${sendingOfficeName}.`,
      } : undefined,
    },
    document_denied: {
      client: {
        title: 'Document Denied',
        message: `Unfortunately, your document "${documentTitle}" has been denied by ${sendingOfficeName}. ${remarks ? `Reason: ${remarks}` : ''}`,
      },
      sender: {
        title: 'Document Denied',
        message: `You denied document "${documentTitle}".`,
      },
    },
    document_forwarded: {
      client: {
        title: 'Document Forwarded',
        message: `Your document "${documentTitle}" has been forwarded from ${sendingOfficeName} to ${receivingOfficeName}.`,
      },
      sender: {
        title: 'Document Forwarded',
        message: `You forwarded document "${documentTitle}" to ${receivingOfficeName}.`,
      },
      receiver: receivingOfficeId ? {
        title: 'New Document Forwarded to You',
        message: `Document "${documentTitle}" has been forwarded to you from ${sendingOfficeName}.`,
      } : undefined,
    },
    document_released: {
      client: {
        title: 'Document Ready for Pickup',
        message: `Your document "${documentTitle}" is now ready for pickup! Please visit ${sendingOfficeName} to collect it.`,
      },
      sender: {
        title: 'Document Released',
        message: `You released document "${documentTitle}" for client pickup.`,
      },
    },
    document_received: {
      client: {
        title: 'Document Received',
        message: `Your document "${documentTitle}" has been received by ${receivingOfficeName}.`,
      },
      receiver: {
        title: 'New Document Arrived',
        message: `New document "${documentTitle}" has arrived from ${sendingOfficeName}.`,
      },
    },
  }

  const actionMessages = messages[action]

  // 1. Notification for CLIENT (document owner)
  if (actionMessages.client) {
    notifications.push({
      user_id: clientId,
      document_id: documentId,
      title: actionMessages.client.title,
      message: actionMessages.client.message,
      is_read: false,
    })
  }

  // 2. Notification for SENDING OFFICE (who performed the action)
  if (sendingOfficeId && actionMessages.sender) {
    notifications.push({
      user_id: sendingOfficeId,
      document_id: documentId,
      title: actionMessages.sender.title,
      message: actionMessages.sender.message,
      is_read: false,
    })
  }

  // 3. Notification for RECEIVING OFFICE (if document is forwarded)
  if (receivingOfficeId && actionMessages.receiver) {
    notifications.push({
      user_id: receivingOfficeId,
      document_id: documentId,
      title: actionMessages.receiver.title,
      message: actionMessages.receiver.message,
      is_read: false,
    })
  }

  // Insert all notifications
  if (notifications.length > 0) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)

    if (error) {
      console.error('Error creating notifications:', error)
      return { success: false, error }
    }

    return { success: true, data }
  }

  return { success: true, data: [] }
}