const fs = require('fs');

const path = 'c:/axiom/src/app/[locale]/(app)/admin/platform/page.tsx';
let data = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!data.includes('import { CreateOrgModal }')) {
  data = data.replace('import { Link } from "@/i18n/routing";', 'import { Link } from "@/i18n/routing";\nimport { CreateOrgModal } from "./create-org-modal";');
}

// 2. Remove CreateOrgModal and SuccessModal bodies
const modalStart = data.indexOf('// ── Create Org Modal');
const tableStart = data.indexOf('// ── Org Table');
if (modalStart !== -1 && tableStart !== -1 && modalStart < tableStart) {
  data = data.substring(0, modalStart) + data.substring(tableStart);
}

// 3. Update OrgTable
const oldTableStr = `// ── Org Table ─────────────────────────────────────────────────────────
function OrgTable({
  orgs,
  t,
}: {
  orgs: OrgRow[];
  t: ReturnType<typeof useTranslations>;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const typeLabels: Record<string, string> = {
    school: t("platform.typeSchool"),
    network: t("platform.typeNetwork"),
    state: t("platform.typeState"),
    private_school: "Escola Particular",
    private_network: "Rede Particular",
    public_municipal: "Rede Municipal",
    public_state: "Rede Estadual",
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#1e1e2e] bg-[#12121a]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e1e2e] text-left text-xs text-[#64748b] uppercase">
            <th className="px-4 py-3">{t("platform.orgName")}</th>
            <th className="px-4 py-3">{t("platform.orgTypeSel")}</th>
            <th className="px-4 py-3">{t("platform.code")}</th>
            <th className="px-4 py-3">{t("platform.maxStudents")}</th>
          </tr>
        </thead>
        <tbody>
          {orgs.map((org: OrgRow) => (
            <tr
              key={org.id}
              className="border-b border-[#1e1e2e]/50 hover:bg-[#1a1a2e]"
            >
              <td className="px-4 py-3">
                <Link
                  href={\`/org/\${org.id}\`}
                  className="font-medium text-white hover:text-[#818cf8]"
                >
                  {org.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-[#94a3b8]">
                {typeLabels[org.type] || org.type}
              </td>
              <td className="px-4 py-3">
                {org.inviteCode ? (
                  <div className="flex items-center gap-1.5">
                    <code className="rounded bg-[#0a0a12] px-2 py-0.5 font-mono text-xs text-[#f59e0b]">
                      {org.inviteCode}
                    </code>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(org.inviteCode);
                        setCopiedId(org.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="text-[#64748b] hover:text-white"
                    >
                      {copiedId === org.id ? (
                        <Check className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[#64748b]">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-[#94a3b8]">
                {org.max_students || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}`;

const newTableStr = `// ── Org Table ─────────────────────────────────────────────────────────
function OrgTable({
  orgs,
  t,
}: {
  orgs: OrgRow[];
  t: ReturnType<typeof useTranslations>;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getTypeBadge = (type: string) => {
    switch(type) {
      case 'private_school': return <span className="inline-flex items-center px-2 py-1 rounded bg-[#64748b]/20 text-[#cbd5e1] text-xs font-medium">Particular</span>;
      case 'private_network': return <span className="inline-flex items-center px-2 py-1 rounded bg-orange-500/20 text-orange-400 text-xs font-medium">Rede Particular</span>;
      case 'public_municipal': return <span className="inline-flex items-center px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-medium">Municipal</span>;
      case 'public_state': return <span className="inline-flex items-center px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-medium">Estadual</span>;
      default: return <span className="inline-flex items-center px-2 py-1 rounded bg-[#64748b]/20 text-[#cbd5e1] text-xs font-medium uppercase">{type}</span>;
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#1e1e2e] bg-[#12121a]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e1e2e] text-left text-xs text-[#64748b] uppercase">
            <th className="px-4 py-3">{t("platform.orgName")}</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">{t("platform.code")}</th>
            <th className="px-4 py-3 text-center">Membros</th>
            <th className="px-4 py-3 text-center">Escolas</th>
            <th className="px-4 py-3 text-right">Criada</th>
          </tr>
        </thead>
        <tbody>
          {orgs.map((org: OrgRow) => (
            <tr
              key={org.id}
              className="border-b border-[#1e1e2e]/50 hover:bg-[#1a1a2e]"
            >
              <td className="px-4 py-3">
                <Link
                  href={\`/org/\${org.id}\`}
                  className="font-medium text-white hover:text-[#818cf8]"
                >
                  {org.name}
                </Link>
              </td>
              <td className="px-4 py-3">
                {getTypeBadge(org.type)}
              </td>
              <td className="px-4 py-3">
                <span className={\`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider \${org.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}\`}>
                  {org.status}
                </span>
              </td>
              <td className="px-4 py-3">
                {org.inviteCode ? (
                  <div className="flex items-center gap-1.5">
                    <code className="rounded bg-[#0a0a12] px-2 py-0.5 font-mono text-xs text-[#f59e0b]">
                      {org.inviteCode}
                    </code>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(org.inviteCode);
                        setCopiedId(org.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="text-[#64748b] hover:text-white"
                    >
                      {copiedId === org.id ? (
                        <Check className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-[#64748b]">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-center text-[#94a3b8]">
                {org.membersCount || 0}
              </td>
              <td className="px-4 py-3 text-center text-[#94a3b8]">
                {['private_network', 'public_municipal', 'public_state', 'network', 'state'].includes(org.type) ? (org.schoolsCount || 0) : '—'}
              </td>
              <td className="px-4 py-3 text-right text-xs text-[#64748b]">
                {new Date(org.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}`;

if (data.includes('function OrgTable({')) {
  // It's possible the string literal match fails due to slight whitespace differences.
  // We can do a string index replacement instead.
  const startIdx = data.indexOf('// ── Org Table');
  const endIdx = data.indexOf('// ── Main Page');
  if (startIdx !== -1 && endIdx !== -1) {
    data = data.substring(0, startIdx) + newTableStr + '\n\n' + data.substring(endIdx);
  }
}

// 4. Remove SuccessModal usage block in main render
const successModalFind = `<SuccessModal
        open={!!successCode}
        code={successCode}
        onClose={() => setSuccessCode("")}
        t={t}
      />`;
data = data.replace(successModalFind, '');
data = data.replace('const [successCode, setSuccessCode] = useState("");', '');
data = data.replace('setSuccessCode(code);', '');

fs.writeFileSync(path, data);
console.log('Patched page.tsx successfully');
