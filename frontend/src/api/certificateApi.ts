import { getClient } from '@/lib/http-client';

export async function getCertificateDetails(id: string): Promise<{ _osSignedData: string }> {
  const response = await getClient().get<{ _osSignedData: string }>(
    `/rc/certificate/v1/download/${id}`,
  );
  return response.data;
}

export async function getPublicKey(osid: string): Promise<{ value: string }> {
  const response = await getClient().get<{ value: string }>(
    `/rc/certificate/v1/key/${osid}`,
  );
  return response.data;
}
