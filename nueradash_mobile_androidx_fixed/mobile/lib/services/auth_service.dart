import 'dart:convert';
import '../core/network/api_client.dart';
import '../core/storage/auth_storage.dart';
import '../models/user_model.dart';

class AuthService {
  final ApiClient _apiClient = ApiClient();

  Future<UserModel> login(String email, String password) async {
    final response = await _apiClient.post('/auth/login', body: {
      'email': email.trim(),
      'password': password,
    });

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final token = data['token'] as String;
      final userJson = data['user'] ?? data;
      final user = UserModel.fromJson(userJson);

      await AuthStorage.saveAuth(
        token: token,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
      );

      return user;
    } else {
      final error = _parseError(response.body, 'Login failed');
      throw Exception(error);
    }
  }

  Future<UserModel> signup(String name, String email, String password) async {
    final response = await _apiClient.post('/auth/signup', body: {
      'name': name.trim(),
      'email': email.trim(),
      'password': password,
    });

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body);
      final token = data['token'] as String;
      final userJson = data['user'] ?? data;
      final user = UserModel.fromJson(userJson);

      await AuthStorage.saveAuth(
        token: token,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
      );

      return user;
    } else {
      final error = _parseError(response.body, 'Signup failed');
      throw Exception(error);
    }
  }

  Future<void> logout() async {
    await AuthStorage.clearAuth();
  }

  Future<bool> isLoggedIn() async {
    final token = await AuthStorage.getToken();
    return token != null && token.isNotEmpty;
  }

  Future<UserModel?> getCurrentUser() async {
    final id = await AuthStorage.getUserId();
    final name = await AuthStorage.getUserName();
    final email = await AuthStorage.getUserEmail();

    if (id == null || email == null) return null;
    return UserModel(id: id, name: name ?? '', email: email);
  }

  String _parseError(String body, String defaultMessage) {
    try {
      final data = jsonDecode(body);
      return data['message'] ?? data['error'] ?? defaultMessage;
    } catch (_) {
      return defaultMessage;
    }
  }
}
