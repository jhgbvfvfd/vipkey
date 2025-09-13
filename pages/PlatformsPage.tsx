import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../App';
import { addPlatform, updatePlatform, deletePlatform } from '../services/firebaseService';
import { Platform } from '../types';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import ToggleSwitch from '../components/ui/ToggleSwitch';

const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setIsOpen(prev => !prev)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 origin-top-right">
                    <div className="py-1" onClick={() => setIsOpen(false)}>
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const DropdownMenuItem: React.FC<{ onClick: () => void; children: React.ReactNode, className?: string }> = ({ onClick, children, className }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 ${className}`}
    >
        {children}
    </button>
);


const PlatformCard: React.FC<{ platform: Platform; onToggleApi: (platform: Platform) => void; onDelete: (platform: Platform) => void; }> = ({ platform, onToggleApi, onDelete }) => {
    const isApiEnabled = platform.apiEnabled !== false; // Default to true if undefined
    return (
        <Card>
            <CardHeader className="flex justify-between items-start">
                <div>
                    <CardTitle>{platform.title}</CardTitle>
                    <p className="text-sm text-slate-500 font-mono bg-slate-100 border border-slate-200 px-2 py-1 rounded-md inline-block mt-2">{platform.id}</p>
                </div>
                 <DropdownMenu>
                    <DropdownMenuItem onClick={() => onDelete(platform)} className="text-red-600 hover:bg-red-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        ลบ
                    </DropdownMenuItem>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-600">สถานะ API</span>
                         <ToggleSwitch
                            checked={isApiEnabled}
                            onChange={() => onToggleApi(platform)}
                        />
                    </div>
                    <p><span className="font-semibold text-slate-600">คำนำหน้าคีย์:</span> <span className="font-mono text-blue-600">{platform.prefix}</span></p>
                    <p><span className="font-semibold text-slate-600">รูปแบบคีย์:</span> <span className="font-mono text-blue-600">{platform.pattern?.join('-') ?? 'N/A'}</span></p>
                </div>
            </CardContent>
        </Card>
    );
};


const PlatformsPage: React.FC = () => {
    const { platforms, loading, refreshData } = useData();
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isConfirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
    const [platformToProcess, setPlatformToProcess] = useState<Platform | null>(null);
    const [newPlatform, setNewPlatform] = useState({ id: '', title: '', prefix: '', pattern: '' });
    const [error, setError] = useState('');

    const handleAddPlatform = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const patternParts = newPlatform.pattern.split("-").map(p => parseInt(p.trim()));
        if (patternParts.some(isNaN) || patternParts.some(n => n < 2 || n > 8)) {
            setError("รูปแบบไม่ถูกต้อง แต่ละส่วนต้องเป็นตัวเลข 2 ถึง 8 คั่นด้วยขีดกลาง (เช่น 4-4-4)");
            return;
        }

        if (!/^[a-z0-9][a-z0-9_-]{1,20}$/.test(newPlatform.id)) {
            setError("ID ไม่ถูกต้อง ต้องมี 2-21 ตัวอักษร (ตัวพิมพ์เล็ก, ตัวเลข, -, _)");
            return;
        }
        
        if (platforms.some(p => p.id === newPlatform.id)) {
            setError("ID แพลตฟอร์มนี้มีอยู่แล้ว");
            return;
        }

        if (!/^[A-Z]{3,4}$/.test(newPlatform.prefix)) {
             setError("คำนำหน้าต้องเป็นตัวพิมพ์ใหญ่ 3-4 ตัวอักษร");
            return;
        }

        try {
            const platformToAdd = {
                id: newPlatform.id,
                title: newPlatform.title,
                prefix: newPlatform.prefix.toUpperCase(),
                pattern: patternParts,
                apiEnabled: true,
            };
            await addPlatform(platformToAdd);
            refreshData();
            setAddModalOpen(false);
            setNewPlatform({ id: '', title: '', prefix: '', pattern: '' });
        } catch (err) {
            setError('ไม่สามารถเพิ่มแพลตฟอร์มได้ กรุณาลองใหม่');
            console.error(err);
        }
    };

    const handleToggleApi = async (platform: Platform) => {
        const updatedPlatform = { ...platform, apiEnabled: platform.apiEnabled === false };
        await updatePlatform(updatedPlatform);
        refreshData();
    };

    const confirmDelete = (platform: Platform) => {
        setPlatformToProcess(platform);
        setConfirmDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!platformToProcess) return;
        await deletePlatform(platformToProcess.id);
        refreshData();
        setConfirmDeleteModalOpen(false);
        setPlatformToProcess(null);
    };
    
  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h1 className="text-xl font-bold text-slate-800">จัดการแพลตฟอร์ม</h1>
                <p className="text-slate-500">เพิ่ม, แก้ไข, และลบแพลตฟอร์มสำหรับสร้างคีย์</p>
            </div>
            <Button onClick={() => setAddModalOpen(true)}>+ เพิ่มแพลตฟอร์ม</Button>
        </div>

        {loading ? <p>กำลังโหลดแพลตฟอร์ม...</p> : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {platforms.map(p => <PlatformCard key={p.id} platform={p} onToggleApi={handleToggleApi} onDelete={confirmDelete} />)}
            </div>
        )}
        { !loading && platforms.length === 0 && <p className="text-slate-500 text-center py-10">ไม่พบแพลตฟอร์ม คลิก "เพิ่มแพลตฟอร์ม" เพื่อเริ่มต้น</p>}
        
        <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="เพิ่มแพลตฟอร์มใหม่">
            <form onSubmit={handleAddPlatform} className="space-y-4">
                <Input label="รหัสแพลตฟอร์ม (ID)" placeholder="เช่น desktop-app" value={newPlatform.id} onChange={e => setNewPlatform({...newPlatform, id: e.target.value.toLowerCase()})} required />
                <Input label="ชื่อแพลตฟอร์ม" placeholder="เช่น 🖥️ Desktop App" value={newPlatform.title} onChange={e => setNewPlatform({...newPlatform, title: e.target.value})} required />
                <Input label="คำนำหน้าคีย์ (Prefix)" placeholder="เช่น DSKT" value={newPlatform.prefix} onChange={e => setNewPlatform({...newPlatform, prefix: e.target.value.toUpperCase()})} required />
                <Input label="รูปแบบคีย์ (Pattern)" placeholder="เช่น 4-4-4-4" value={newPlatform.pattern} onChange={e => setNewPlatform({...newPlatform, pattern: e.target.value})} required />
                
                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={() => setAddModalOpen(false)}>ยกเลิก</Button>
                    <Button type="submit">สร้างแพลตฟอร์ม</Button>
                </div>
            </form>
        </Modal>

        <Modal isOpen={isConfirmDeleteModalOpen} onClose={() => setConfirmDeleteModalOpen(false)} title="ยืนยันการลบ">
             <div>
                <p className="text-slate-600 mb-4">คุณแน่ใจหรือไม่ว่าต้องการลบแพลตฟอร์ม <strong className="font-semibold text-slate-800">{platformToProcess?.title}</strong>? คีย์ทั้งหมดที่เกี่ยวข้องกับแพลตฟอร์มนี้อาจใช้งานไม่ได้ การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="secondary" onClick={() => setConfirmDeleteModalOpen(false)}>ยกเลิก</Button>
                    <Button variant="danger" onClick={handleDelete}>ยืนยันการลบ</Button>
                </div>
            </div>
        </Modal>
    </div>
  );
};

export default PlatformsPage;