import React from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const CodeBlock: React.FC<{ children: React.ReactNode, language?: string }> = ({ children, language = 'bash' }) => (
    <pre className="bg-slate-800 text-white rounded-md p-4 my-2 text-sm overflow-x-auto border border-slate-200">
        <code className={`language-${language}`}>{children}</code>
    </pre>
);

const ApiGuidePage: React.FC = () => {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-xl font-bold text-slate-800">คู่มือ API</h1>
            <p className="text-slate-500">คำแนะนำสำหรับนักพัฒนาในการใช้งาน API</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>API สำหรับตรวจสอบและใช้งานคีย์</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="mb-4">
                    เอกสารนี้อธิบายวิธีการที่บริการภายนอกสามารถโต้ตอบกับข้อมูลที่จัดการโดยแดชบอร์ดนี้
                    ซึ่งจำเป็นต้องมี Backend ที่ปลอดภัย (เช่น Cloud Function) ที่สามารถอ่านข้อมูลจาก Firebase database ได้
                    API ถูกออกแบบมาให้เรียบง่ายและเป็นแบบ RESTful
                </p>

                <p className="mb-4">
                    การตอบกลับที่สำเร็จทั้งหมดจะเป็นอ็อบเจกต์ JSON ที่มี `{"ok": true, ...}` ส่วนการตอบกลับที่ผิดพลาดจะมี `{"ok": false, "error": "ERROR_CODE", "message": "..."}`
                </p>

                <div className="space-y-8">
                    <div>
                        <h4 className="text-lg font-semibold text-slate-800">1. ตรวจสอบเครดิตของคีย์</h4>
                        <p>ตรวจสอบความถูกต้องของคีย์และจำนวนโทเค็นที่เหลืออยู่</p>
                        <CodeBlock>
                            GET /api/&lt;platform_id&gt;/credit?key=YOUR_KEY
                        </CodeBlock>
                        <p className="font-semibold mt-2">ตัวอย่างการตอบกลับที่สำเร็จ (200 OK):</p>
                        <CodeBlock language="json">
{`{
  "ok": true,
  "tokens_remaining": 998,
  "status": "active"
}`}
                        </CodeBlock>
                        <p className="font-semibold mt-2">ตัวอย่างการตอบกลับที่ผิดพลาด (404 Not Found):</p>
                        <CodeBlock language="json">
{`{
  "ok": false,
  "error": "KEY_NOT_FOUND",
  "message": "The provided key does not exist."
}`}
                        </CodeBlock>
                    </div>
                    
                    <div>
                        <h4 className="text-lg font-semibold text-slate-800">2. ใช้โทเค็นจากคีย์</h4>
                        <p>หักโทเค็นจากคีย์ที่ระบุ การดำเนินการนี้จะลดจำนวน `tokens_remaining`</p>
                        <CodeBlock>
                            POST /api/&lt;platform_id&gt;/use
                        </CodeBlock>
                        <p className="font-semibold mt-2">Body (JSON):</p>
                        <CodeBlock language="json">
{`{
  "key": "YOUR_KEY",
  "tokens": 1
}`}
                        </CodeBlock>
                        <p className="font-semibold mt-2">ตัวอย่างการตอบกลับที่สำเร็จ (200 OK):</p>
                        <CodeBlock language="json">
{`{
  "ok": true,
  "tokens_remaining": 997,
  "message": "Tokens deducted successfully."
}`}
                        </CodeBlock>
                        <p className="font-semibold mt-2">ตัวอย่างการตอบกลับที่ผิดพลาด (400 Bad Request - เครดิตไม่พอ):</p>
                        <CodeBlock language="json">
{`{
  "ok": false,
  "error": "INSUFFICIENT_TOKENS",
  "message": "The key does not have enough tokens for this operation."
}`}
                        </CodeBlock>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
};

export default ApiGuidePage;