import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';

class ManualClassificationScreen extends StatefulWidget {
  const ManualClassificationScreen({super.key});

  @override
  State<ManualClassificationScreen> createState() => _ManualClassificationScreenState();
}

class _ManualClassificationScreenState extends State<ManualClassificationScreen> {
  String _selectedCategory = 'Weapon';
  final _nameController = TextEditingController(text: 'Tactical Fixed Blade Knife');
  final _descController = TextEditingController(text: 'Found discarded under shrubbery near perimeter boundary.');
  final _notesController = TextEditingController(text: 'Preserved with biological trace evidence on edge.');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgDark,
      appBar: AppBar(
        backgroundColor: AppColors.bgDark,
        title: const Text(
          'Human Classification',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Reference AI Banner
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.purple.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.purple.withOpacity(0.3)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.auto_awesome, color: AppColors.purple, size: 16),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'AI Reference: Weapon (Knife) • 94.2% Confidence (Non-binding)',
                        style: TextStyle(color: AppColors.purple, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Category Selector
              const Text('Forensic Category *', style: TextStyle(color: AppColors.textSecondaryDark, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceDark,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.borderDark),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedCategory,
                    dropdownColor: AppColors.surfaceDark,
                    isExpanded: true,
                    style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                    items: ['Weapon', 'Biological', 'Document', 'Electronics', 'Substances', 'Trace']
                        .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                        .toList(),
                    onChanged: (val) => setState(() => _selectedCategory = val ?? _selectedCategory),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Object Name
              const Text('Evidence Item Name *', style: TextStyle(color: AppColors.textSecondaryDark, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              TextField(
                controller: _nameController,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: AppColors.surfaceDark,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.borderDark),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Description
              const Text('Physical Description', style: TextStyle(color: AppColors.textSecondaryDark, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              TextField(
                controller: _descController,
                maxLines: 2,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: AppColors.surfaceDark,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.borderDark),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Officer Notes
              const Text('Officer Forensic Notes', style: TextStyle(color: AppColors.textSecondaryDark, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              TextField(
                controller: _notesController,
                maxLines: 2,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: AppColors.surfaceDark,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.borderDark),
                  ),
                ),
              ),
              const SizedBox(height: 28),

              // Submit & Seal CTA
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: () => context.push('/officer/sealed'),
                  icon: const Icon(Icons.lock, color: Colors.white, size: 18),
                  label: const Text(
                    'APPLY SHA-256 SEAL & GENERATE QR',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
