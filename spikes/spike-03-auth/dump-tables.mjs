import { getAuthTables } from 'better-auth/db';
import { emailOTP } from 'better-auth/plugins/email-otp';
const t = getAuthTables({ rateLimit: { enabled: true, storage: 'database' }, plugins: [emailOTP({ async sendVerificationOTP() {} })] });
for (const [k, v] of Object.entries(t)) console.log(k, '->', v.modelName, JSON.stringify(Object.fromEntries(Object.entries(v.fields).map(([f, d]) => [f, { type: d.type, req: d.required, unique: d.unique, ref: d.references ? d.references.model + '.' + d.references.field + ':' + (d.references.onDelete || '') : undefined, name: d.fieldName, index: d.index }]))));
