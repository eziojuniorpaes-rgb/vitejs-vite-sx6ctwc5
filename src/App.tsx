import {
  useEffect,
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';
import type {
  AuthError,
  Session,
} from '@supabase/supabase-js';
import { supabase } from './services/supabase';
import './App.css';

type AuthMode = 'login' | 'signup';

type Profile = {
  id: string;
  full_name: string;
  email: string | null;
  status: 'pendente' | 'ativo' | 'inativo';
};

const PENDING_EMAIL_KEY =
  'comunicacao-igreja-pending-email';

export default function App() {
  const [session, setSession] =
    useState<Session | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [authMode, setAuthMode] =
    useState<AuthMode>('login');

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [resending, setResending] =
    useState(false);

  const [message, setMessage] = useState('');

  const [pendingEmail, setPendingEmail] =
    useState(() => {
      return (
        localStorage.getItem(PENDING_EMAIL_KEY) ?? ''
      );
    });

  useEffect(() => {
    let active = true;

    function handleConfirmationRedirect() {
      const hash = window.location.hash;

      if (!hash || !hash.includes('error=')) {
        return;
      }

      const parameters = new URLSearchParams(
        hash.replace(/^#/, '')
      );

      const errorCode =
        parameters.get('error_code') ?? '';

      const errorDescription = decodeURIComponent(
        parameters.get('error_description') ?? ''
      );

      if (errorCode === 'otp_expired') {
        setMessage(
          'O link de confirmação expirou ou já foi utilizado. Solicite um novo e-mail de confirmação.'
        );
      } else if (errorCode === 'access_denied') {
        setMessage(
          'Não foi possível confirmar o e-mail por meio desse link. Solicite um novo e-mail de confirmação.'
        );
      } else if (errorDescription) {
        setMessage(
          translateAuthError(errorDescription)
        );
      } else {
        setMessage(
          'Não foi possível concluir a confirmação do e-mail.'
        );
      }

      window.history.replaceState(
        {},
        document.title,
        `${window.location.pathname}${window.location.search}`
      );
    }

    async function initializeAuth() {
      try {
        handleConfirmationRedirect();

        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!active) {
          return;
        }

        setSession(currentSession);
      } catch (error) {
        console.error(
          'Erro ao inicializar autenticação:',
          error
        );

        if (active) {
          setMessage(
            getAuthErrorMessage(
              error,
              'Não foi possível verificar sua sessão.'
            )
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!active) {
          return;
        }

        setSession(currentSession);

        if (!currentSession) {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function synchronizeProfile() {
      if (!session) {
        setProfile(null);
        return;
      }

      setLoading(true);

      const loadedProfile = await loadProfile(
        session.user.id
      );

      if (active) {
        setProfile(loadedProfile);
        setLoading(false);
      }
    }

    void synchronizeProfile();

    return () => {
      active = false;
    };
  }, [session]);

  async function loadProfile(
    userId: string
  ): Promise<Profile | null> {
    const maximumAttempts = 3;

    for (
      let attempt = 1;
      attempt <= maximumAttempts;
      attempt += 1
    ) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, status')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        return data as Profile;
      }

      if (error) {
        console.error(
          `Erro ao carregar perfil. Tentativa ${attempt}:`,
          error
        );

        if (
          error.code !== 'PGRST116' &&
          error.code !== 'PGRST205'
        ) {
          setMessage(
            `Não foi possível carregar o perfil: ${error.message}`
          );

          return null;
        }
      }

      if (attempt < maximumAttempts) {
        await wait(700 * attempt);
      }
    }

    setMessage(
      'A autenticação foi concluída, mas o perfil ainda não está disponível. Verifique se o perfil foi criado no Supabase e se as políticas de acesso estão configuradas.'
    );

    return null;
  }

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setMessage('');

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const email = String(form.get('email') ?? '')
      .trim()
      .toLowerCase();

    const password = String(
      form.get('password') ?? ''
    );

    if (!email) {
      setMessage('Informe seu endereço de e-mail.');
      setSubmitting(false);
      return;
    }

    if (!password) {
      setMessage('Informe sua senha.');
      setSubmitting(false);
      return;
    }

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        throw error;
      }

      localStorage.removeItem(PENDING_EMAIL_KEY);
      setPendingEmail('');

      setSession(data.session);
      formElement.reset();
    } catch (error) {
      console.error(
        'Erro completo no login:',
        error
      );

      const authError = getSupabaseAuthError(error);

      if (
        authError?.message
          .toLowerCase()
          .includes('email not confirmed')
      ) {
        savePendingEmail(email);
      }

      setMessage(
        getAuthErrorMessage(
          error,
          'Não foi possível realizar o login.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignUp(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setMessage('');

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const fullName = String(
      form.get('fullName') ?? ''
    )
      .trim()
      .replace(/\s+/g, ' ');

    const email = String(form.get('email') ?? '')
      .trim()
      .toLowerCase();

    const password = String(
      form.get('password') ?? ''
    );

    const confirmPassword = String(
      form.get('confirmPassword') ?? ''
    );

    if (fullName.length < 3) {
      setMessage('Informe seu nome completo.');
      setSubmitting(false);
      return;
    }

    if (!email) {
      setMessage('Informe seu endereço de e-mail.');
      setSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setMessage(
        'A senha deve possuir pelo menos 8 caracteres.'
      );

      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage('As senhas não coincidem.');
      setSubmitting(false);
      return;
    }

    try {
      const { data, error } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo:
              getEmailRedirectUrl(),
          },
        });

      if (error) {
        throw error;
      }

      savePendingEmail(email);

      if (data.session) {
        localStorage.removeItem(PENDING_EMAIL_KEY);
        setPendingEmail('');
        setSession(data.session);
      } else {
        setAuthMode('login');

        setMessage(
          `Conta criada com sucesso. Enviamos um link de confirmação para ${email}. Confirme o endereço antes de fazer o primeiro login.`
        );
      }

      formElement.reset();
    } catch (error) {
      console.error(
        'Erro completo no cadastro:',
        error
      );

      setMessage(
        getAuthErrorMessage(
          error,
          'Não foi possível criar a conta.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    if (!pendingEmail || resending) {
      return;
    }

    setResending(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
        options: {
          emailRedirectTo:
            getEmailRedirectUrl(),
        },
      });

      if (error) {
        throw error;
      }

      setMessage(
        `Um novo link de confirmação foi enviado para ${pendingEmail}. Utilize somente o e-mail mais recente.`
      );
    } catch (error) {
      console.error(
        'Erro ao reenviar confirmação:',
        error
      );

      setMessage(
        getAuthErrorMessage(
          error,
          'Não foi possível reenviar o e-mail de confirmação.'
        )
      );
    } finally {
      setResending(false);
    }
  }

  async function handleSignOut() {
    setMessage('');

    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error(
        'Erro ao encerrar a sessão:',
        error
      );

      setMessage(
        getAuthErrorMessage(
          error,
          'Não foi possível encerrar a sessão. Tente novamente.'
        )
      );
    }
  }

  function savePendingEmail(email: string) {
    localStorage.setItem(PENDING_EMAIL_KEY, email);
    setPendingEmail(email);
  }

  function getEmailRedirectUrl() {
    return `${window.location.origin}/`;
  }

  function getSupabaseAuthError(
    error: unknown
  ): AuthError | null {
    if (
      error &&
      typeof error === 'object' &&
      'message' in error
    ) {
      return error as AuthError;
    }

    return null;
  }

  function getAuthErrorMessage(
    error: unknown,
    fallback: string
  ) {
    const authError = getSupabaseAuthError(error);

    if (authError) {
      return translateAuthError(
        authError.message,
        authError.code
      );
    }

    if (error instanceof Error) {
      return translateAuthError(error.message);
    }

    return fallback;
  }

  function translateAuthError(
    error: string,
    code?: string
  ) {
    const normalized = error.toLowerCase();
    const normalizedCode = code?.toLowerCase() ?? '';

    console.error('Erro de autenticação:', {
      message: error,
      code,
    });

    if (
      normalized.includes(
        'invalid login credentials'
      )
    ) {
      return 'E-mail ou senha incorretos. Se a conta acabou de ser criada, confirme primeiro o link enviado ao e-mail.';
    }

    if (
      normalized.includes('email not confirmed') ||
      normalizedCode === 'email_not_confirmed'
    ) {
      return 'Confirme seu endereço de e-mail antes de entrar. Verifique também a caixa de spam. Se o link expirou, solicite um novo envio.';
    }

    if (
      normalized.includes(
        'user already registered'
      ) ||
      normalizedCode ===
        'user_already_exists'
    ) {
      return 'Já existe uma conta cadastrada com este e-mail.';
    }

    if (
      normalized.includes('signup is disabled')
    ) {
      return 'A criação de novas contas está desabilitada no Supabase.';
    }

    if (
      normalized.includes(
        'email rate limit exceeded'
      ) ||
      normalized.includes('rate limit') ||
      normalizedCode.includes('rate_limit')
    ) {
      return 'Foram realizadas muitas tentativas ou enviados muitos e-mails em pouco tempo. Aguarde alguns minutos e tente novamente.';
    }

    if (
      normalized.includes('invalid email') ||
      normalized.includes(
        'email address is invalid'
      )
    ) {
      return 'O endereço de e-mail informado não foi aceito pelo serviço de autenticação.';
    }

    if (
      normalized.includes(
        'email address not authorized'
      )
    ) {
      return 'O serviço de autenticação ainda não está autorizado a enviar mensagens para este endereço.';
    }

    if (
      normalized.includes(
        'password should be'
      ) ||
      normalized.includes('weak password')
    ) {
      return 'A senha não atende aos requisitos de segurança.';
    }

    if (
      normalized.includes('otp_expired') ||
      normalized.includes('token has expired') ||
      normalized.includes('expired')
    ) {
      return 'O link de confirmação expirou ou já foi utilizado. Solicite um novo e-mail e utilize somente o link mais recente.';
    }

    if (
      normalized.includes('redirect') ||
      normalizedCode.includes('redirect')
    ) {
      return 'O endereço de retorno da confirmação não está autorizado no Supabase.';
    }

    if (
      normalized.includes('network') ||
      normalized.includes('failed to fetch') ||
      normalized.includes(
        'err_name_not_resolved'
      )
    ) {
      return 'Não foi possível acessar o serviço de autenticação. Verifique a conexão e tente novamente.';
    }

    return `Erro na autenticação: ${error}`;
  }

  function wait(milliseconds: number) {
    return new Promise<void>((resolve) => {
      window.setTimeout(resolve, milliseconds);
    });
  }

  function switchAuthMode() {
    setMessage('');

    setAuthMode((currentMode) =>
      currentMode === 'login'
        ? 'signup'
        : 'login'
    );
  }

  if (loading) {
    return (
      <main className="app-loading">
        <div className="loading-symbol">✦</div>
        <p>Carregando...</p>
      </main>
    );
  }

  if (session && profile) {
    return (
      <main className="welcome-page">
        <section className="welcome-card">
          <div className="assistant-symbol">✦</div>

          <p className="eyebrow">
            COMUNICAÇÃO · VERBO CUIABÁ
          </p>

          <h1>Olá, {profile.full_name}</h1>

          <p className="welcome-text">
            Sua autenticação e seu perfil estão
            funcionando.
          </p>

          <dl className="profile-test">
            <div>
              <dt>E-mail</dt>
              <dd>{profile.email ?? session.user.email}</dd>
            </div>

            <div>
              <dt>Status</dt>
              <dd>{profile.status}</dd>
            </div>
          </dl>

          {message && (
            <div
              className="auth-message"
              role="alert"
              aria-live="polite"
            >
              {message}
            </div>
          )}

          <button
            type="button"
            className="secondary-button"
            onClick={handleSignOut}
          >
            Sair da conta
          </button>
        </section>
      </main>
    );
  }

  if (session && !profile) {
    return (
      <main className="welcome-page">
        <section className="welcome-card">
          <div className="assistant-symbol">✦</div>

          <p className="eyebrow">
            COMUNICAÇÃO · VERBO CUIABÁ
          </p>

          <h1>Perfil não encontrado</h1>

          <p className="welcome-text">
            A autenticação foi concluída, mas não foi
            possível carregar os dados do perfil.
          </p>

          {message && (
            <div
              className="auth-message"
              role="alert"
              aria-live="polite"
            >
              {message}
            </div>
          )}

          <button
            type="button"
            className="secondary-button"
            onClick={handleSignOut}
          >
            Sair da conta
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="assistant-symbol">✦</div>

        <p className="eyebrow">
          COMUNICAÇÃO · VERBO CUIABÁ
        </p>

        <h1>
          {authMode === 'login'
            ? 'Acesse sua conta'
            : 'Crie sua conta'}
        </h1>

        <p className="auth-description">
          Registre relatórios, acompanhe ocorrências e
          acesse os recursos do departamento.
        </p>

        <form
          onSubmit={
            authMode === 'login'
              ? handleLogin
              : handleSignUp
          }
        >
          {authMode === 'signup' && (
            <label>
              Nome completo

              <input
                name="fullName"
                type="text"
                autoComplete="name"
                required
                minLength={3}
                maxLength={120}
                placeholder="Digite seu nome completo"
              />
            </label>
          )}

          <label>
            E-mail

            <input
              name="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="email"
              required
              maxLength={254}
              defaultValue={pendingEmail}
              placeholder="seuemail@exemplo.com"
            />
          </label>

          <label>
            Senha

            <input
              name="password"
              type="password"
              autoComplete={
                authMode === 'login'
                  ? 'current-password'
                  : 'new-password'
              }
              required
              minLength={8}
              maxLength={128}
              placeholder="Digite sua senha"
            />
          </label>

          {authMode === 'signup' && (
            <label>
              Confirmar senha

              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                placeholder="Digite novamente"
              />
            </label>
          )}

          {message && (
            <div
              className="auth-message"
              role="alert"
              aria-live="polite"
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={submitting || resending}
          >
            {submitting
              ? 'Aguarde...'
              : authMode === 'login'
                ? 'Entrar'
                : 'Criar conta'}
          </button>
        </form>

        {authMode === 'login' && pendingEmail && (
          <button
            type="button"
            className="switch-button"
            onClick={handleResendConfirmation}
            disabled={submitting || resending}
          >
            {resending
              ? 'Reenviando confirmação...'
              : 'Reenviar e-mail de confirmação'}
          </button>
        )}

        <button
          type="button"
          className="switch-button"
          onClick={switchAuthMode}
          disabled={submitting || resending}
        >
          {authMode === 'login'
            ? 'Ainda não tenho uma conta'
            : 'Já tenho uma conta'}
        </button>
      </section>
    </main>
  );
}