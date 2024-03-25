export enum ListenEvent {
  Connect = 'connect',
  PrivateMessage = 'private_message',
  MarkMessageAsSeen = 'mark_message_as_seen',
  SendFriendRequest = 'send_friend_request',
}

export enum EmitEvent {
  Error = 'error',
  Success = 'success',
  UserOnline = 'user_online',
  UserOffline = 'user_offline',
  OnlineFriends = 'online_friends',
  MessageSent = 'message_sent',
  ReceiveMessage = 'receive_message',
  MessageSeen = 'message_seen',
  PrimeAndGenerator = 'prime_and_generator',
  FriendRequestAccepted = 'friend_request_accepted',
  FriendRequestReceived = 'friend_request_received',
}

export enum Status {
  Online = 'online',
  Offline = 'offline',
}
