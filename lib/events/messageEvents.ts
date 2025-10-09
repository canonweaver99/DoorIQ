import { EventEmitter } from 'events'

class MessageEvents extends EventEmitter {
  private static instance: MessageEvents

  private constructor() {
    super()
  }

  static getInstance(): MessageEvents {
    if (!MessageEvents.instance) {
      MessageEvents.instance = new MessageEvents()
    }
    return MessageEvents.instance
  }

  emitMessagesRead() {
    this.emit('messages-read')
  }

  onMessagesRead(callback: () => void) {
    this.on('messages-read', callback)
    return () => this.off('messages-read', callback)
  }
}

export const messageEvents = MessageEvents.getInstance()
