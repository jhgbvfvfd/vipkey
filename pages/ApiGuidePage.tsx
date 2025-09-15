import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useSettings } from '../App';

const CodeBlock: React.FC<{ children: string; language?: string }> = ({ children, language = 'bash' }) => {
    const { notify, t } = useSettings();
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(children.trim());
            notify(t('copySuccess'));
        } catch (err) {
            notify(t('copyFailed'), 'error');
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
                {t('copy')}
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
  const { t } = useSettings();
  return (
    <div className="max-w-screen-md mx-auto space-y-6">
        <EndpointCard step={1} title="ตรวจสอบเครดิตของคีย์">
            <p>ตรวจสอบความถูกต้องของคีย์และจำนวนโทเค็นที่เหลืออยู่</p>
            <CodeBlock>{`GET /api/<platform_id>/credit?key=YOUR_KEY`}</CodeBlock>
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
            <CodeBlock>{`POST /api/<platform_id>/use`}</CodeBlock>
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
