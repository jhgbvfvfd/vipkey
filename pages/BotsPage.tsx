
import React, { useState } from 'react';
import { useAuth, useData } from '../App';
import { addBot } from '../services/firebaseService';
import { Bot } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import { CpuChipIcon } from '@heroicons/react/24/outline';

const BotsPage: React.FC = () => {
    const { bots, loading, refreshData } = useData();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBot, setNewBot] = useState({ name: '', url: '' });
    const [error, setError] = useState('');

    const isAgent = user?.role === 'agent';

    const BotCard: React.FC<{ bot: Bot }> = ({ bot }) => (
        <Card className="p-3" onClick={isAgent ? () => window.open(bot.url, '_blank', 'noopener,noreferrer') : undefined}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h3 className="font-semibold text-slate-800 text-md">{bot.name}</h3>
                    <a href={bot.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 font-mono break-all hover:underline">{bot.url}</a>
                </div>
                <p className="text-sm text-slate-500 mt-2 sm:mt-0 sm:text-right flex-shrink-0">เพิ่มเมื่อ: {new Date(bot.addedAt).toLocaleDateString('th-TH')}</p>
            </div>
        </Card>
    );

    const handleAddBot = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const newId = `bot_${Date.now()}`;
            await addBot({
                id: newId,
                name: newBot.name,
                url: newBot.url,
                addedAt: new Date().toISOString(),
            });
            refreshData();
            setIsModalOpen(false);
            setNewBot({ name: '', url: '' });
        } catch (err) {
            setError('ไม่สามารถเพิ่มบอทได้');
            console.error(err);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <PageHeader
                      icon={<CpuChipIcon className="w-5 h-5" />}
                      title="ไดเรกทอรีบอท"
                      description="จัดการรายชื่อบอทในระบบของคุณ"
                    />
                </div>
                {!isAgent && <Button onClick={() => setIsModalOpen(true)}>+ เพิ่มบอท</Button>}
            </div>

            {loading ? <p>กำลังโหลดบอท...</p> : (
                <div className="space-y-4">
                    {bots.map(bot => <BotCard key={bot.id} bot={bot} />)}
                    {bots.length === 0 && <p className="text-center p-10 text-slate-500">ยังไม่มีบอทในไดเรกทอรี</p>}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="เพิ่มบอทไปยังไดเรกทอรี">
                <form onSubmit={handleAddBot} className="space-y-4">
                    <Input label="ชื่อบอท" placeholder="เช่น My Awesome Bot" value={newBot.name} onChange={e => setNewBot({...newBot, name: e.target.value})} required />
                    <Input label="URL ของบอท" placeholder="เช่น https://t.me/my_bot" type="url" value={newBot.url} onChange={e => setNewBot({...newBot, url: e.target.value})} required />
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>
                        <Button type="submit">เพิ่มบอท</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default BotsPage;
