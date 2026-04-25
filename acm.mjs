import { DeleteCertificateCommand, DescribeCertificateCommand, ListCertificatesCommand, RequestCertificateCommand, ACMClient } from '@aws-sdk/client-acm';

const acmClient = new ACMClient({
    region: 'us-east-1', // Cloudfront only supports certificates created/stored in this region
});

export const listCertificates = async () => {
    const command = new ListCertificatesCommand({});
    return await acmClient.send(command);
}
