import { useState } from 'react';
import { Scan, X, CheckCircle2, AlertCircle, Camera } from 'lucide-react';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import { useAppStore } from '@/store';

interface QRCodeScannerProps {
  type: 'borrow' | 'return';
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QRCodeScanner({ type, isOpen, onClose, onSuccess }: QRCodeScannerProps) {
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');
  const { tools, borrowTool, returnTool, currentUser } = useAppStore();

  const handleScan = () => {
    setScanning(true);
    setResult(null);
    setMessage('');

    setTimeout(() => {
      setScanning(false);
      if (currentUser.isBlacklisted) {
        setResult('error');
        setMessage('您当前处于黑名单中，无法借用工具');
        return;
      }

      const codes = tools.map((t) => t.qrCode);
      const randomCode = codes[Math.floor(Math.random() * codes.length)];
      handleVerify(randomCode);
    }, 1500);
  };

  const handleManualInput = () => {
    if (!manualCode.trim()) {
      setResult('error');
      setMessage('请输入工具编号');
      return;
    }
    handleVerify(manualCode.trim().toUpperCase());
  };

  const handleVerify = (code: string) => {
    const tool = tools.find((t) => t.qrCode === code);

    if (!tool) {
      setResult('error');
      setMessage('未找到该工具，请检查编号是否正确');
      return;
    }

    if (type === 'borrow') {
      if (tool.availableStock <= 0) {
        setResult('error');
        setMessage(`「${tool.name}」暂无可用库存`);
        return;
      }
      borrowTool(tool.id);
      setResult('success');
      setMessage(`成功借出「${tool.name}」，请按时归还`);
    } else {
      const borrowedRecord = useAppStore
        .getState()
        .borrowRecords.find(
          (r) => r.toolId === tool.id && r.status === 'borrowed' && r.userId === currentUser.id
        );
      if (!borrowedRecord) {
        setResult('error');
        setMessage('您没有正在借用的该工具');
        return;
      }
      returnTool(borrowedRecord.id);
      setResult('success');
      setMessage(`成功归还「${tool.name}」，押金将在1-3个工作日内退还`);
    }

    setTimeout(() => {
      onSuccess?.();
      handleClose();
    }, 2000);
  };

  const handleClose = () => {
    setManualCode('');
    setResult(null);
    setMessage('');
    setScanning(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={type === 'borrow' ? '扫码借出' : '扫码归还'} size="md">
      <div className="space-y-6">
        <div className="relative mx-auto w-64 h-64">
          <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden">
            {scanning ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative">
                  <div className="w-48 h-48 border-2 border-blue-500 rounded-lg">
                    <div className="absolute inset-x-2 h-0.5 bg-blue-500 animate-scan" />
                  </div>
                  <p className="text-center text-white text-sm mt-4">正在扫描二维码...</p>
                </div>
              </div>
            ) : result ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                {result === 'success' ? (
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-3" />
                ) : (
                  <AlertCircle className="w-16 h-16 text-red-500 mb-3" />
                )}
                <p className={`text-center text-sm ${result === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {message}
                </p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Camera className="w-16 h-16 text-gray-500 mb-3" />
                <p className="text-gray-400 text-sm">点击下方按钮开始扫描</p>
              </div>
            )}
          </div>
        </div>

        {!result && (
          <>
            <Button
              onClick={handleScan}
              loading={scanning}
              size="lg"
              className="w-full"
            >
              <Scan className="w-4 h-4 mr-2" />
              {scanning ? '扫描中...' : type === 'borrow' ? '扫描工具二维码借出' : '扫描工具二维码归还'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或手动输入</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Input
                placeholder="请输入工具编号，如 TOOL-T1-001"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualInput()}
              />
              <Button onClick={handleManualInput} variant="outline">
                确认
              </Button>
            </div>
          </>
        )}

        {result && (
          <Button onClick={handleClose} variant="outline" size="lg" className="w-full">
            {result === 'success' ? '完成' : '重新扫描'}
          </Button>
        )}
      </div>
    </Modal>
  );
}
