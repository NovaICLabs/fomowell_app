import request from '@/utils/request/imgRequest';
export const postImg = (fileImg: File): Promise<{ reference: string }> => {
  const formData = new FormData();
  formData.append('file', fileImg);
  return fetch('/api/files/upload', {
    method: 'POST',
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData) => {
          throw new Error(`Error: ${errorData.message}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      if (data.reference) {
        return { reference: data.reference };
      } else {
        throw new Error('upload Error');
      }
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
};
export const download = (fileImg: string) => {
  const formData = new FormData();
  formData.append('file', fileImg);
  return fetch(`/api/files/download/${fileImg}`, {
    method: 'GET',
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData) => {
          throw new Error(`get Error: ${errorData.message}`);
        });
      }
      return response.json();
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
};
export const QeqImg = (fileImg: File): Promise<{ reference: string }> => {
  const formData = new FormData();
  formData.append('file', fileImg);
  return request.post({
    url: `/files/upload`,
    data: formData,
    requestConfig: {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  });
};
