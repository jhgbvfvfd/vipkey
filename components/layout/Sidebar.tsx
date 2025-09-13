import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import Logo from '../ui/Logo';

const NavIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-6 h-6">{children}</div>
);

const navLinks = [
  { to: '/', text: 'แดชบอร์ด', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> },
  { to: '/platforms', text: 'แพลตฟอร์ม', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-1.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h9.75a2.25 2.25 0 012.25 2.25z" /></svg> },
  { to: '/agents', text: 'ตัวแทน', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.598M12 14.25a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5z" /></svg> },
  { to: '/generate-key', text: 'สร้างคีย์', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg> },
  { to: '/bots', text: 'ไดเรกทอรีบอท', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.684-2.684l-1.938-.648 1.938-.648a3.375 3.375 0 002.684-2.684l.648-1.938.648 1.938a3.375 3.375 0 002.684 2.684l1.938.648-1.938.648a3.375 3.375 0 00-2.684 2.684z" /></svg> },
  { to: '/api-guide', text: 'คู่มือ API', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg> },
];

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsOpen(false)}
      ></div>
      
      <aside className={`w-64 flex-shrink-0 bg-white border-r border-slate-200 p-4 flex flex-col justify-between fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 p-2 bg-blue-600 text-white rounded-lg mr-3 flex items-center justify-center">
                <Logo className="w-6 h-6" />
              </div>
              <h1 className="text-lg font-bold text-slate-800">Key Master</h1>
            </div>
             <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
           <div className="px-3 py-4 mb-4 border-t border-b border-slate-200">
                <h2 className="text-md font-semibold text-slate-800">ผู้ดูแลระบบ</h2>
                <p className="text-sm text-slate-500">สถานะ: ออนไลน์</p>
            </div>

          <nav>
            <ul>
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 font-medium ${
                        isActive
                          ? 'bg-slate-100 text-blue-600 border-l-4 border-blue-600'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <NavIcon>{link.icon}</NavIcon>
                    <span className="ml-3">{link.text}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <button onClick={handleLogout} className="flex items-center p-3 w-full text-left rounded-lg text-slate-600 hover:bg-red-500 hover:text-white transition-colors duration-200 font-medium">
          <NavIcon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg></NavIcon>
          <span className="ml-3">ออกจากระบบ</span>
        </button>
      </aside>
    </>
  );
};

export default Sidebar;