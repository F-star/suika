import { FC, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { ApiService } from '../../api-service';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PasswordInput } from '../../components/ui/password-input';
import { toast } from '../../components/ui/toast';

export const Login: FC = () => {
  const intl = useIntl();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const navigate = useNavigate();

  const submitting = useRef(false);

  const submit = async () => {
    if (!username || !password || submitting.current) {
      return;
    }
    submitting.current = true;

    const loginOrRegisterRequest =
      mode === 'login' ? ApiService.login : ApiService.register;

    loginOrRegisterRequest(username, password)
      .then(() => {
        navigate('/files');
      })
      .catch((res) => {
        const message = res.response.data.message;
        toast.error(message);
      })
      .finally(() => {
        submitting.current = false;
      });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="w-[440px] py-10 px-8 bg-card">
        <div className="pb-8 font-normal text-[24px] text-center">
          <FormattedMessage
            id={mode === 'login' ? 'welcomeBack' : 'createNewAccount'}
          />
        </div>
        <Input
          value={username}
          placeholder={intl.formatMessage({ id: 'username' })}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-4"
        />
        <div className="mb-6">
          <PasswordInput
            value={password}
            placeholder={intl.formatMessage({ id: 'password' })}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button
          size="lg"
          variant="default"
          className="w-full"
          onClick={submit}
          disabled={submitting.current}
        >
          <FormattedMessage id={mode === 'login' ? 'login' : 'createAccount'} />
        </Button>
        <div className="flex items-center justify-center mt-4 text-sm text-black/50">
          {mode === 'login' ? (
            <>
              <FormattedMessage id="NoAccount?" />
              <Button
                variant="link"
                onClick={() => setMode('register')}
                className="h-auto p-0"
              >
                <FormattedMessage id="createAccount" />
              </Button>
            </>
          ) : (
            <>
              <FormattedMessage id="alreadyHaveAnAccount?" />
              <Button
                variant="link"
                onClick={() => setMode('login')}
                className="h-auto p-0"
              >
                <FormattedMessage id="login" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
