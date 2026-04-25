import { listCertificates } from './acm.mjs';

export const handler = async (event) => {
  // TODO implement
  const certificates = await listCertificates();
  const response = {
    statusCode: 200,
    body: JSON.stringify(certificates),
  };
  return response;
};
