class ChatMessage {
  final String sender; // 'user' or 'assistant'
  final String text;
  final DateTime timestamp;
  final bool isError;

  ChatMessage({
    required this.sender,
    required this.text,
    DateTime? timestamp,
    this.isError = false,
  }) : timestamp = timestamp ?? DateTime.now();

  bool get isUser => sender == 'user';

  Map<String, dynamic> toApiHistory() {
    return {
      'role': isUser ? 'user' : 'model',
      'parts': [{'text': text}],
    };
  }
}
