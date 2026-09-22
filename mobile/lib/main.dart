import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'services/auth_service.dart';
import 'screens/auth/login_screen.dart';
import 'screens/main_navigation_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final authService = AuthService();
  final isLoggedIn = await authService.isLoggedIn();

  runApp(NeuraDashApp(initialIsLoggedIn: isLoggedIn));
}

class NeuraDashApp extends StatelessWidget {
  final bool initialIsLoggedIn;

  const NeuraDashApp({
    super.key,
    required this.initialIsLoggedIn,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NeuraDash',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: initialIsLoggedIn ? const MainNavigationScreen() : const LoginScreen(),
    );
  }
}
