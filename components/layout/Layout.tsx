import React, { useState } from 'react';
import AdminSidebar from './Sidebar';
import AgentSidebar from './AgentSidebar';
import { useAuth } from '../../App';
import { Agent } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface LayoutProps {
  children: React.ReactNode;
}

const HamburgerIcon: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="p-2 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 md:hidden">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    </button>
);


const CreditHistoryModal: React.FC<{isOpen: boolean, onClose: () => void, agent: Agent | null}> = ({isOpen, onClose, agent}) => {
    if (!agent) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`ประวัติเครดิต: ${agent.username}`}>
            <div className="max-h-96 overflow-y-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-slate-500">
                        <tr>
                            <th className="p-2 font-semibold">วันที่</th>
                            <th className="p-2 font-semibold">รายการ</th>
                            <th className="p-2 font-semibold text-right">จำนวน</th>
                            <th className="p-2 font-semibold text-right">คงเหลือ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agent.creditHistory && agent.creditHistory.length > 0 ? (
                            [...agent.creditHistory].reverse().map((entry, index) => (
                                <tr key={index} className="border-b border-slate-200 last:border-b-0 odd:bg-white even:bg-slate-50 hover:bg-slate-100">
                                    <td className="p-2 text-slate-500 whitespace-nowrap">{new Date(entry.date).toLocaleString('th-TH')}</td>
                                    <td className="p-2 text-slate-600">{entry.action}</td>
                                    <td className={`p-2 text-right font-semibold ${entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {entry.amount >= 0 ? `+${entry.amount.toLocaleString()}` : entry.amount.toLocaleString()}
                                    </td>
                                    <td className="p-2 text-right text-slate-600">{entry.balanceAfter.toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="text-center p-6 text-slate-500">ไม่พบประวัติเครดิต</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
             <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
                <Button variant="secondary" onClick={onClose}>ปิด</Button>
            </div>
        </Modal>
    );
}


const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
  const { user } = useAuth();
  const agent = user?.role === 'agent' ? user.data as Agent : null;

  return (
    <>
        <div className="flex h-screen bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100">
        {user?.role === 'admin' ? 
            <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} /> :
            <AgentSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        }
        <div className="flex-1 flex flex-col overflow-x-hidden">
            <header className="p-1.5 border-b border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 flex items-center">
                <HamburgerIcon onClick={() => setIsSidebarOpen(true)} />

                {agent && (
                    <div 
                        className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ml-auto"
                        onClick={() => setHistoryModalOpen(true)}
                        >
                        <div className="text-yellow-500">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8.433 7.418c.158-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.162-.328zM11.567 7.151v-1.698c.22.071.409.164.567.267a2.5 2.5 0 00-1.134 1.431z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v.518a2.5 2.5 0 00-2.5 2.482V11a2.5 2.5 0 002.5 2.5h.171a2.5 2.5 0 002.329-1.951l.006-.008a2.5 2.5 0 00-2.335-3.043V5z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500 hidden sm:block">เครดิต</p>
                            <p className="text-base font-bold text-blue-600">{agent.credits.toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </header>
            <main className="flex-1 p-3 md:p-4 overflow-y-auto">
                {children}
            </main>
        </div>
        </div>
        {agent && <CreditHistoryModal isOpen={isHistoryModalOpen} onClose={() => setHistoryModalOpen(false)} agent={agent} />}
    </>
  );
};

export default Layout;