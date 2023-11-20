export enum ListenEvent {
  Connect = 'connect',
  PrivateMessage = 'private_message',
}

export enum EmitEvent {
  Error = 'error',
  Success = 'success',
  UserOnline = 'user_online',
  UserOffline = 'user_offline',
  OnlineFriends = 'online_friends',
  MessageSent = 'message_sent',
  PrivateMessage = 'private_message',
}

export enum Status {
  Online = 'online',
  Offline = 'offline',
}
