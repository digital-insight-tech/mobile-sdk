import { Mdoc, MdocRecord, SdJwtVcRecord, W3cCredentialRecord } from '@credo-ts/core'
import type { AdeyaAgent } from '../agent'
import { decodeW3cCredential } from '../format/credentialEncoding'
import { getBatchCredentialMetadata } from './batchMetadata'
import { updateCredential } from './openIdHelpers'

export async function handleBatchCredential<CredentialRecord extends W3cCredentialRecord | SdJwtVcRecord | MdocRecord>(
  agent: AdeyaAgent,
  credentialRecord: CredentialRecord
): Promise<CredentialRecord> {
  const batchMetadata = getBatchCredentialMetadata(credentialRecord)
  if (!batchMetadata) return credentialRecord

  const batchCredential = batchMetadata.additionalCredentials.pop()
  if (batchCredential) await updateCredential(agent, credentialRecord)

  if (batchCredential) {
    if (credentialRecord instanceof MdocRecord) {
      return new MdocRecord({
        mdoc: Mdoc.fromBase64Url(batchCredential as string),
      }) as CredentialRecord
    }
    if (credentialRecord instanceof SdJwtVcRecord) {
      return new SdJwtVcRecord({
        compactSdJwtVc: batchCredential as string,
      }) as CredentialRecord
    }
    if (credentialRecord instanceof W3cCredentialRecord) {
      return new W3cCredentialRecord({
        tags: { expandedTypes: [] },
        credential: decodeW3cCredential(batchCredential),
      }) as CredentialRecord
    }
  }

  return credentialRecord
}
