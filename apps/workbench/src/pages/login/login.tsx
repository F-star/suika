import { Button, ConfigProvider, Input, message } from 'antd';
import { FC, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { ApiService } from '../../api-service';
import styles from './login.module.less';

export const Login: FC = () => {
  const intl = useIntl();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const navigate = useNavigate();

  const [messageApi, contextHolder] = message.useMessage();

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
        messageApi.open({
          type: 'error',
          key: 'error',
          content: message,
        });
      })
      .finally(() => {
        submitting.current = false;
      });
  };

  return (
    <div className={styles.loginPage}>
      <ConfigProvider
        theme={{
          components: {
            Input: {
              inputFontSizeLG: 16,
              paddingBlockLG: 10,
              paddingInlineLG: 15,
            },
            Button: {
              contentFontSizeLG: 16,
              paddingInline: 2,
            },
          },
        }}
      >
        {contextHolder}
        <div className={styles.loginBox}>
          <div className={styles.loginTitle}>
            <FormattedMessage
              id={mode === 'login' ? 'welcomeBack' : 'createNewAccount'}
            />
          </div>
          <Input
            value={username}
            size="large"
            placeholder={intl.formatMessage({ id: 'username' })}
            variant="filled"
            onChange={(e) => setUsername(e.target.value)}
          />
          <div style={{ margin: '16px 0 24px 0' }}>
            <Input.Password
              value={password}
              size="large"
              placeholder={intl.formatMessage({ id: 'password' })}
              variant="filled"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            size="large"
            type="primary"
            style={{ width: '100%', height: 48 }}
            onClick={submit}
          >
            <FormattedMessage
              id={mode === 'login' ? 'login' : 'createAccount'}
            />
          </Button>
          <div className={styles.loginBottom}>
            {mode === 'login' ? (
              <>
                <FormattedMessage id="NoAccount?" />
                <Button type="link" onClick={() => setMode('register')}>
                  <FormattedMessage id="createAccount" />
                </Button>
              </>
            ) : (
              <>
                <FormattedMessage id="alreadyHaveAnAccount?" />
                <Button type="link" onClick={() => setMode('login')}>
                  <FormattedMessage id="login" />
                </Button>
              </>
            )}
          </div>
        </div>
      </ConfigProvider>
    </div>
  );
};
