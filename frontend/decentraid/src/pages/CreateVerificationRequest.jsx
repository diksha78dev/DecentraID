import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { Input, Select, Textarea } from '../components/common/Input';
import ErrorState from '../components/common/ErrorState';
import DataValue from '../components/common/DataValue';
import { useMutation } from '../hooks/useAsync';
import verificationService from '../services/verificationService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { CREDENTIAL_TYPES } from '../utils/constants';

export default function CreateVerificationRequest() {
  const navigate = useNavigate();
  const toast = useToast();
  const { mockMode } = useAuth();

  const [form, setForm] = useState({
    holderReference: '',
    credentialId: '',
    credentialType: '',
    purpose: '',
  });
  const [errors, setErrors] = useState({});
  const create = useMutation((payload) => verificationService.createRequest(payload));

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.holderReference.trim()) next.holderReference = 'Enter the holder wallet address or email.';
    if (!form.credentialId.trim() && !form.credentialType) {
      next.credentialId = 'Give a credential ID, or choose a credential type.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      const request = await create.mutate({
        holderReference: form.holderReference.trim(),
        credentialId: form.credentialId.trim() || undefined,
        credentialType: form.credentialType || undefined,
        purpose: form.purpose.trim() || undefined,
      });
      toast.success('Request ' + request.id + ' sent to ' + request.holderName + '.');
      navigate('/verifier/requests');
    } catch (err) {
      toast.error(err?.message || 'The verification request could not be sent.');
    }
  };

  return (
    <>
      <PageHeader
        title="New verification request"
        description="The holder is asked to share a credential. You receive a result once they approve."
      />

      <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardBody className="space-y-5 p-5 sm:p-6">
            <fieldset className="space-y-5" disabled={create.pending}>
              <legend className="sr-only">Request details</legend>

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
                    : 'The address the holder uses in the registry.'
                }
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Credential ID"
                  mono
                  placeholder="CERT-001"
                  value={form.credentialId}
                  onChange={set('credentialId')}
                  error={errors.credentialId}
                  hint="If you know the exact identifier."
                />
                <Select
                  label="Or credential type"
                  placeholder="Any type"
                  options={CREDENTIAL_TYPES}
                  value={form.credentialType}
                  onChange={set('credentialType')}
                  hint="Ask for a category instead of a specific credential."
                />
              </div>

              <Textarea
                label="Purpose"
                rows={3}
                placeholder="Pre-employment screening for a backend engineering role."
                value={form.purpose}
                onChange={set('purpose')}
                hint="Shown to the holder so they can judge the request."
              />
            </fieldset>

            {create.error ? <ErrorState compact error={create.error} /> : null}

            <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={() => setForm({ holderReference: '', credentialId: '', credentialType: '', purpose: '' })}
                disabled={create.pending}
              >
                Clear form
              </Button>
              <Button type="submit" loading={create.pending}>
                {create.pending ? 'Sending request' : 'Send verification request'}
              </Button>
            </div>
          </CardBody>
        </Card>

        <aside className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">How this works</h2>
            <ol className="mt-3 space-y-3 text-sm text-ink-muted">
              <li>1. The holder receives your request and chooses a credential.</li>
              <li>2. The registry checks the credential hash and its revocation flag.</li>
              <li>3. You receive a result: valid, invalid, revoked or expired.</li>
            </ol>
            <p className="mt-4 border-t border-line pt-4 text-sm text-ink-soft">
              You can re-check a shared credential at any time. A credential revoked after sharing
              will report as revoked on the next check.
            </p>
          </Card>

          {mockMode ? (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-ink">Demo holder</h2>
              <p className="mt-2 text-sm text-ink-soft">Aarav Sharma holds CERT-001.</p>
              <div className="mt-2">
                <DataValue
                  value="0x2C9fD43a15Be870c4E6a92B07dF13548Ca6b9E20"
                  truncate
                  label="demo holder wallet"
                />
              </div>
            </Card>
          ) : null}
        </aside>
      </form>
    </>
  );
}
