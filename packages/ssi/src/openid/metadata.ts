import type { OpenId4VciCredentialConfigurationSupportedWithFormats, OpenId4VciCredentialIssuerMetadataDisplay } from '@credo-ts/openid4vc'
import type { SdJwtVcRecord, W3cCredentialRecord } from '@credo-ts/core'

export type CredentialDisplayClaims =
  | (OpenId4VciCredentialConfigurationSupportedWithFormats & {
      format: 'vc+sd-jwt'
    })['claims']
  | (OpenId4VciCredentialConfigurationSupportedWithFormats & {
      format: 'dc+sd-jwt'
    })['claims']

export interface OpenId4VcCredentialMetadata {
  credential: {
    display?: OpenId4VciCredentialIssuerMetadataDisplay['display']
    claims?: CredentialDisplayClaims
    order?: OpenId4VciCredentialConfigurationSupportedWithFormats['order']
  }
  issuer: {
    display?: OpenId4VciCredentialIssuerMetadataDisplay[]
    id: string
  }
}

export const openId4VcCredentialMetadataKey = '_Adeya/openId4VcCredentialMetadata'

export function extractOpenId4VcCredentialMetadata(
  credentialMetadata: {
    display?: OpenId4VciCredentialIssuerMetadataDisplay['display']
    order?: OpenId4VciCredentialConfigurationSupportedWithFormats['order']
  },
  // biome-ignore lint/suspicious/noExplicitAny: We need to use any here because the type is not exported from the package.
  serverMetadata: any
): OpenId4VcCredentialMetadata {
  return {
    credential: {
      display: credentialMetadata.display,
      order: credentialMetadata.order,
    },
    issuer: {
      display: serverMetadata.credentialIssuerMetadata?.display,
      id: serverMetadata.issuer,
    },
  }
}

/**
 * Gets the OpenId4Vc credential metadata from the given W3C credential record.
 */
export function getOpenId4VcCredentialMetadata(
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord
): OpenId4VcCredentialMetadata | null {
  return credentialRecord.metadata.get(openId4VcCredentialMetadataKey)
}

/**
 * Sets the OpenId4Vc credential metadata on the given W3cCredentialRecord or SdJwtVcRecord.
 *
 * NOTE: this does not save the record.
 */
export function setOpenId4VcCredentialMetadata(
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord,
  metadata: OpenId4VcCredentialMetadata
) {
  credentialRecord.metadata.set(openId4VcCredentialMetadataKey, metadata)
}
