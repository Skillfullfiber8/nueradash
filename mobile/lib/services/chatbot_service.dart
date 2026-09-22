import 'dart:convert';
import '../core/network/api_client.dart';
import '../models/chat_message_model.dart';

class ChatbotService {
  final ApiClient _apiClient = ApiClient();

  Future<String> sendMessage(String message, List<ChatMessage> history) async {
    final historyPayload = history
        .map((m) => {
              'sender': m.sender,
              'text': m.text,
            })
        .toList();

    final response = await _apiClient.post('/insights/chat', body: {
      'message': message,
      'history': historyPayload,
    });

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['reply'] ?? data['response'] ?? 'No response received.';
    }
    throw Exception('Failed to get chat response (${response.statusCode})');
  }
}
