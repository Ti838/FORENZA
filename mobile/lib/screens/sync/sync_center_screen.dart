import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../core/services/offline_vault_service.dart';
import '../../core/services/sync_engine.dart';

class SyncCenterScreen extends StatefulWidget {
  const SyncCenterScreen({super.key});

  @override
  State<SyncCenterScreen> createState() => _SyncCenterScreenState();
}

class _SyncCenterScreenState extends State<SyncCenterScreen> {
  List<OfflineEvidenceItem> _items = [];
  bool _isLoading = true;
  bool _isSyncing = false;
  String? _syncMessage;

  @override
  void initState() {
    super.initState();
    _loadVaultItems();
  }

  Future<void> _loadVaultItems() async {
    setState(() => _isLoading = true);
    final items = await OfflineVaultService.getAllOfflineEvidence();
    if (mounted) {
      setState(() {
        _items = items;
        _isLoading = false;
      });
    }
  }

  Future<void> _triggerSync() async {
    setState(() {
      _isSyncing = true;
      _syncMessage = null;
    });

    final res = await SyncEngine.synchronizePendingVault(
      userToken: 'OFFICER-PERSISTED-SESSION-TOKEN',
    );

    await _loadVaultItems();

    if (mounted) {
      setState(() {
        _isSyncing = false;
        _syncMessage = 'Sync Result: ${res['status']} (${res['synced'] ?? 0} synced, ${res['failed'] ?? 0} failed)';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final pendingCount = _items.where((i) => i.syncStatus == OfflineEvidenceStatus.syncPending).length;
    final verifiedCount = _items.where((i) => i.syncStatus == OfflineEvidenceStatus.serverVerified).length;

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B0F19),
        title: const Text(
          'OFFLINE VAULT & SYNC CENTER',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw, size: 18),
            onPressed: _loadVaultItems,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Stat Cards
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFF334155)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('PENDING SYNC', style: TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text('$pendingCount Items', style: const TextStyle(color: Color(0xFFFBBF24), fontSize: 16, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFF334155)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('SERVER VERIFIED', style: TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text('$verifiedCount Items', style: const TextStyle(color: Color(0xFF10B981), fontSize: 16, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Sync All Action Button
                  ElevatedButton.icon(
                    onPressed: _isSyncing ? null : _triggerSync,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: _isSyncing
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(LucideIcons.cloudUpload, size: 18),
                    label: Text(_isSyncing ? 'SYNCHRONIZING WITH SERVER...' : 'SYNCHRONIZE ALL PENDING EVIDENCE'),
                  ),

                  if (_syncMessage != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      _syncMessage!,
                      style: const TextStyle(color: Color(0xFF60A5FA), fontSize: 12, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                  ],

                  const SizedBox(height: 16),

                  const Text(
                    'LOCAL ENCRYPTED EVIDENCE ITEMS',
                    style: TextStyle(color: Colors.white54, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1),
                  ),

                  const SizedBox(height: 8),

                  Expanded(
                    child: _items.isEmpty
                        ? const Center(
                            child: Text(
                              'Local encrypted vault is empty.\nEmergency captured items will appear here.',
                              style: TextStyle(color: Colors.white38, fontSize: 12),
                              textAlign: TextAlign.center,
                            ),
                          )
                        : ListView.builder(
                            itemCount: _items.length,
                            itemBuilder: (ctx, index) {
                              final item = _items[index];
                              final isVerified = item.syncStatus == OfflineEvidenceStatus.serverVerified;

                              return Card(
                                color: const Color(0xFF1E293B),
                                margin: const EdgeInsets.only(bottom: 10),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  side: BorderSide(
                                    color: isVerified ? const Color(0xFF10B981).withOpacity(0.4) : const Color(0xFF334155),
                                  ),
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.between,
                                        children: [
                                          Text(
                                            item.evidenceId,
                                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'monospace', fontSize: 13),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: isVerified ? const Color(0xFF10B981).withOpacity(0.2) : const Color(0xFFFBBF24).withOpacity(0.2),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Text(
                                              item.syncStatus.name.toUpperCase(),
                                              style: TextStyle(
                                                color: isVerified ? const Color(0xFF10B981) : const Color(0xFFFBBF24),
                                                fontWeight: FontWeight.bold,
                                                fontSize: 10,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        'Category: ${item.manualCategory} • Type: ${item.mediaType}',
                                        style: const TextStyle(color: Colors.white70, fontSize: 11),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'SHA-256: ${item.masterEvidenceHash.substring(0, 16)}...',
                                        style: const TextStyle(color: Color(0xFF60A5FA), fontFamily: 'monospace', fontSize: 10),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            ),
    );
  }
}
