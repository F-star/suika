import './App.css';

import { IntlProvider } from 'react-intl';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { NormalLayout } from './layout/normal-layout';
import { en, SupportedLocale, zh } from './locale';
import { DraftPage } from './pages/drafts/drafts';
import { FilesPage } from './pages/files-page';
import { Login } from './pages/login';
import { TeamPage } from './pages/team';
import { TrashPage } from './pages/trash/trash';

const router = createBrowserRouter([
  {
    path: '/',
    element: <div>Hello world!</div>,
  },
  {
    path: '/files/team/:teamId',
    element: <NormalLayout />,
    children: [
      {
        path: 'recents',
        element: <FilesPage />,
      },
      {
        path: 'drafts',
        element: <DraftPage />,
      },
      {
        path: 'all-projects',
        element: <TeamPage />,
      },
      {
        path: 'trash',
        element: <TrashPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
]);

const messageMap = {
  zh,
  en,
};

const getLocale = (): SupportedLocale => {
  const locale = localStorage.getItem('suika-locale') || navigator.language;
  return locale.startsWith('zh') ? 'zh' : 'en';
};

const App = () => {
  const locale = getLocale();

  return (
    <IntlProvider locale={locale} messages={messageMap[locale]}>
      <RouterProvider router={router} />
    </IntlProvider>
  );
};

export default App;
