import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import { BookOpenIcon } from '@heroicons/react/24/outline';

const CodeBlock: React.FC<{ children: string; language?: string }> = ({ children, language = 'bash' }) => {
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(children.trim());
            toast.success('คัดลอกแล้ว');
        } catch (err) {
            toast.error('คัดลอกไม่สำเร็จ');
        }
    };

    return (
        <div className="relative">
            <pre className="bg-slate-800 text-white rounded-md p-4 my-2 text-sm overflow-x-auto border border-slate-200">
                <code className={`language-${language}`}>{children}</code>
            </pre>
            <Button
                size="sm"
                variant="secondary"
                onClick={handleCopy}
                className="absolute top-2 right-2"
            >
                คัดลอก
            </Button>
        </div>
    );
};

const EndpointCard: React.FC<{ step: number; title: string; children: React.ReactNode }> = ({ step, title, children }) => (
    <Card>
        <CardHeader className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                {step}
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
            {children}
        </CardContent>
    </Card>
);

const ApiGuidePage: React.FC = () => {
  return (
    <div className="max-w-screen-md mx-auto space-y-6">
        <div>
            <PageHeader
              icon={<BookOpenIcon className="w-5 h-5" />}
              title="คู่มือ API"
              description="คำแนะนำสำหรับนักพัฒนาในการใช้งาน API"
            />
        </div>

        <EndpointCard step={1} title="ตรวจสอบเครดิตของคีย์">
            <p>ตรวจสอบความถูกต้องของคีย์และจำนวนโทเค็นที่เหลืออยู่</p>
            <CodeBlock>
GET /api/&lt;platform_id&gt;/credit?key=YOUR_KEY
            </CodeBlock>
            <p className="font-semibold mt-2">ตัวอย่างการตอบกลับที่สำเร็จ (200 OK):</p>
            <CodeBlock language="json">{`{
  "ok": true,
  "tokens_remaining": 998,
  "status": "active"
}`}</CodeBlock>
            <p className="font-semibold mt-2">ตัวอย่างการตอบกลับที่ผิดพลาด (404 Not Found):</p>
            <CodeBlock language="json">{`{
  "ok": false,
  "error": "KEY_NOT_FOUND",
  "message": "The provided key does not exist."
}`}</CodeBlock>
        </EndpointCard>

        <EndpointCard step={2} title="ใช้โทเค็นจากคีย์">
            <p>หักโทเค็นจากคีย์ที่ระบุ การดำเนินการนี้จะลดจำนวน \`tokens_remaining\`</p>
            <CodeBlock>
POST /api/&lt;platform_id&gt;/use
            </CodeBlock>
            <p className="font-semibold mt-2">Body (JSON):</p>
            <CodeBlock language="json">{`{
  "key": "YOUR_KEY",
  "tokens": 1
}`}</CodeBlock>
            <p className="font-semibold mt-2">ตัวอย่างการตอบกลับที่สำเร็จ (200 OK):</p>
            <CodeBlock language="json">{`{
  "ok": true,
  "tokens_remaining": 997,
  "message": "Tokens deducted successfully."
}`}</CodeBlock>
            <p className="font-semibold mt-2">ตัวอย่างการตอบกลับที่ผิดพลาด (400 Bad Request - เครดิตไม่พอ):</p>
            <CodeBlock language="json">{`{
  "ok": false,
  "error": "INSUFFICIENT_TOKENS",
  "message": "The key does not have enough tokens for this operation."
}`}</CodeBlock>
        </EndpointCard>

        <p className="text-xs text-slate-500 text-center">
            การตอบกลับที่สำเร็จทั้งหมดจะเป็นอ็อบเจกต์ JSON ที่มี{' '}
            <code>{"{ \"ok\": true, ... }"}</code>{' '}
            ส่วนการตอบกลับที่ผิดพลาดจะมี{' '}
            <code>{"{ \"ok\": false, \"error\": \"ERROR_CODE\", \"message\": \"...\" }"}</code>
        </p>
    </div>
  );
};

export default ApiGuidePage;
