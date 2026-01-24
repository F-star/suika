import { useEffect, useState } from 'react';

import { ApiService } from '@/api-service';

export const useUserInfo = () => {
  const [userInfo, setUserInfo] = useState<{
    username: string;
    id: string;
  } | null>(null);
  useEffect(() => {
    ApiService.getUserInfo().then((res) => {
      console.log(res.data);
      setUserInfo(res.data);
    });
  }, []);
  return userInfo;
};

export const useFileInfo = (fileId: string) => {
  const [fileInfo, setFileInfo] = useState<{
    title: string;
    id: string;
  } | null>(null);
  useEffect(() => {
    ApiService.getFile(fileId).then((res) => {
      setFileInfo(res.data);
    });
  }, [fileId]);
  return fileInfo;
};
