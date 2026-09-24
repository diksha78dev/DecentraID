import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { Input, Select } from '../components/common/Input';
import OffChainNotice from '../components/common/OffChainNotice';
import ErrorState from '../components/common/ErrorState';
import DataValue from '../components/common/DataValue';
import { useMutation } from '../hooks/useAsync';
import credentialService from '../services/credentialService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { CREDENTIAL_TYPES, ISSUER_STATUS } from '../utils/constants';

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY = {
  holderReference: '',
  holderName: '',
  type: '',
  credentialId: '',
  title: '',
  issuedAt: today(),
  expiresAt: '',
  documentReference: '',
};

export default function IssueCredential() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, mockMode } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const issue = useMutation((payload) => credentialService.issue(payload));

  const authorized = user?.status === ISSUER_STATUS.AUTHORIZED;
  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.holderReference.trim()) next.holderReference = 'Enter the holder wallet address or email.';
    if (!form.type) next.type = 'Select a credential type.';
    if (!form.credentialId.trim()) next.credentialId = 'Give the credential an identifier.';
    if (form.expiresAt && form.issuedAt && form.expiresAt < form.issuedAt) {
      next.expiresAt = 'The expiry date cannot precede the issue date.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const created = await issue.mutate({
        holderReference: form.holderReference.trim(),
        holderName: form.holderName.trim() || undefined,
        type: form.type,
        credentialId: form.credentialId.trim(),
        title: form.title.trim() || form.type,
        issuedAt: form.issuedAt || undefined,
        expiresAt: form.expiresAt || undefined,
        documentReference: form.documentReference.trim() || undefined,
      });
      toast.success(created.credentialId + ' issued to ' + created.holderName + '.');
      navigate('/credentials/' + encodeURIComponent(created.credentialId));
    } catch (err) {
      toast.error(err?.message || 'The credential could not be issued.');
    }
  };

  return (
    <>
      <PageHeader
        title="Issue credential"
        description="The holder receives the credential against their wallet address. A hash of this metadata is anchored as the integrity record."
      />

      {!authorized ? (
        <Card className="border-warn-500/30 bg-warn-50 p-5">
          <p className="text-sm font-medium text-warn-700">
            This account cannot issue credentials until a registry administrator authorises it.
          </p>
        </Card>
      ) : (
        <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardBody className="space-y-5 p-5 sm:p-6">
              <fieldset className="space-y-5" disabled={issue.pending}>
                <legend className="sr-only">Holder</legend>
                <Input
                  label="Holder wallet address or email"
                  required
                  mono
                  placeholder="0x…"
                  value={form.holderReference}
                  onChange={set('holderReference')}
                  error={errors.holderReference}
                  hint={
                    mockMode
                      ? 'Demo holder: 0x2C9fD43a15Be870c4E6a92B07dF13548Ca6b9E20'
                      : 'The address the credential will be issued against.'
                  }
                />
                <Input
                  label="Holder display name"
                  placeholder="Aarav Sharma"
                  value={form.holderName}
                  onChange={set('holderName')}
                  hint="Shown in your records. Resolved from the registry when left blank."
                />
              </fieldset>

              <hr className="border-line" />

              <fieldset className="grid gap-5 sm:grid-cols-2" disabled={issue.pending}>
                <legend className="sr-only">Credential</legend>
                <Select
                  label="Credential type"
                  required
                  placeholder="Select a type"
                  options={CREDENTIAL_TYPES}
                  value={form.type}
                  onChange={set('type')}
                  error={errors.type}
                />
                <Input
                  label="Credential ID"
                  required
                  mono
                  placeholder="CERT-002"
                  value={form.credentialId}
                  onChange={set('credentialId')}
                  error={errors.credentialId}
                />
                <Input
                  label="Title"
                  className="sm:col-span-2"
                  placeholder="Java Certification — Advanced"
                  value={form.title}
                  onChange={set('title')}
                  hint="Optional. Defaults to the credential type."
                />
                <Input
                  label="Issue date"
                  type="date"
                  value={form.issuedAt}
                  onChange={set('issuedAt')}
                />
                <Input
                  label="Expiry date"
                  type="date"
                  value={form.expiresAt}
                  onChange={set('expiresAt')}
                  error={errors.expiresAt}
                  hint="Leave blank if the credential does not expire."
                />
                <Input
                  label="Document reference"
                  className="sm:col-span-2"
                  mono
                  placeholder="ipfs://… or your document management URL"
                  value={form.documentReference}
                  onChange={set('documentReference')}
                  hint="A pointer to where the certificate is stored. The document is not uploaded here."
                />
              </fieldset>

              <OffChainNotice />

              {issue.error ? <ErrorState compact error={issue.error} /> : null}

              <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={() => setForm(EMPTY)} disabled={issue.pending}>
                  Clear form
                </Button>
                <Button type="submit" loading={issue.pending}>
                  {issue.pending ? 'Anchoring credential' : 'Issue credential'}
                </Button>
              </div>
            </CardBody>
          </Card>

          <aside className="space-y-4">
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-ink">What gets anchored</h2>
              <ul className="mt-3 space-y-2.5 text-sm text-ink-muted">
                <li>A hash of the credential ID, type and holder reference.</li>
                <li>The issuing organisation&apos;s address.</li>
                <li>Issue and expiry dates, and the revocation flag.</li>
              </ul>
              <h2 className="mt-5 text-sm font-semibold text-ink">What never leaves your systems</h2>
              <ul className="mt-3 space-y-2.5 text-sm text-ink-muted">
                <li>The certificate document itself.</li>
                <li>Identity numbers, addresses and contact details.</li>
                <li>Marks, grades and any other personal record.</li>
              </ul>
            </Card>

            {mockMode ? (
              <Card className="p-5">
                <h2 className="text-sm font-semibold text-ink">Demo holder addresses</h2>
                <div className="mt-3 space-y-3 text-sm">
                  <div>
                    <p className="text-ink-soft">Aarav Sharma</p>
                    <DataValue
                      value="0x2C9fD43a15Be870c4E6a92B07dF13548Ca6b9E20"
                      truncate
                      label="Aarav Sharma wallet"
                    />
                  </div>
                  <div>
                    <p className="text-ink-soft">Priya Nair</p>
                    <DataValue
                      value="0x8Fa2b07C31eD649a05B7c2E8134Df96b0A7e5C34"
                      truncate
                      label="Priya Nair wallet"
                    />
                  </div>
                </div>
              </Card>
            ) : null}
          </aside>
        </form>
      )}
    </>
  );
}
