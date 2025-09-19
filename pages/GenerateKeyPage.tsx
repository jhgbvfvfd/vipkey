import React, { useState, useEffect } from 'react';
import { useData, useSettings } from '../App';
import { StandaloneKey } from '../types';
import { addStandaloneKey } from '../services/firebaseService';
import { generateKey } from '../utils/keyGenerator';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import PlatformSelector from '../components/ui/PlatformSelector';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

const GenerateKeyPage: React.FC = () => {
  const { platforms, refreshData } = useData();
  const { notify } = useSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [selectedPlatformId, setSelectedPlatformId] = useState(platforms[0]?.id || '');
  const [tokens, setTokens] = useState(100);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (platforms.length > 0 && !selectedPlatformId) {
      setSelectedPlatformId(platforms[0].id);
    }
  }, [platforms, selectedPlatformId]);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedPlatformId) {
      setError('กรุณาเลือกแพลตฟอร์ม');
      return;
    }
    const platform = platforms.find(p => p.id === selectedPlatformId);
    if (!platform) {
      setError('เลือกแพลตฟอร์มไม่ถูกต้อง');
      return;
    }
    try {
      const newKeyString = generateKey(platform.prefix, platform.pattern);
      const newKeyObject: Omit<StandaloneKey, 'id'> & { id: string } = {
        id: `key_${Date.now()}`,
        key: newKeyString,
        tokens_remaining: Number(tokens),
        status: 'active',
        createdAt: new Date().toISOString(),
        platformId: platform.id,
        platformTitle: platform.title,
      };
      await addStandaloneKey(newKeyObject);
      refreshData();
      setGeneratedKey(newKeyString);
      setIsModalOpen(true);
      notify('สร้างคีย์เรียบร้อย');
    } catch {
      setError('ไม่สามารถสร้างคีย์ได้');
    }
  };

  const handleModalCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      notify('คัดลอกแล้ว');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify('คัดลอกไม่สเร็จ', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>เลือกแพลตฟอร์ม</CardTitle>
        </CardHeader>
        <CardContent>
          <PlatformSelector platforms={platforms} selected={selectedPlatformId} onSelect={setSelectedPlatformId} />
        </CardContent>
      </Card>

      {selectedPlatformId && (
        <Card>
          <CardHeader>
            <CardTitle>สร้างคีย์ใหม่สำหรับ {platforms.find(p => p.id === selectedPlatformId)?.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerateKey} className="space-y-4">
              <Input label="โทเค็น" type="number" value={tokens} onChange={e => setTokens(Number(e.target.value))} required />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={!selectedPlatformId}>สร้าง</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="สร้างคีย์สำเร็จ">
        <div>
          <p className="text-slate-600 mb-4">คัดลอกคีย์ด้านล่างนี้ คีย์จะแสดงเพียงครั้งเดียวเท่านั้น</p>
          <div className="bg-slate-100 p-4 rounded-lg font-mono text-blue-600 break-all border border-slate-200">{generatedKey}</div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleModalCopy} leftIcon={<ClipboardIcon className="w-4 h-4" />}>
              {copied ? <><CheckIcon className="w-4 h-4 mr-1" />คัดลอกแล้ว</> : 'คัดลอกไปยังคลิปบอร์ด'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GenerateKeyPage;
