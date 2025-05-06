import {
  DidJwk,
  DidKey,
  DidsApi,
  type JwkDidCreateOptions,
  KeyBackend,
  type KeyDidCreateOptions,
  getJwkFromKey,
} from '@credo-ts/core'
import { type OpenId4VciCredentialBindingResolver, OpenId4VciCredentialFormatProfile } from '@credo-ts/openid4vc'

export function getCredentialBindingResolver(): OpenId4VciCredentialBindingResolver {
  return async ({
    supportedDidMethods,
    keyTypes,
    supportsAllDidMethods,
    supportsJwk,
    credentialFormat,
    agentContext,
  }) => {
    // First, we try to pick a did method
    // Prefer did:jwk, otherwise use did:key, otherwise use undefined
    let didMethod: 'key' | 'jwk' | undefined =
      supportsAllDidMethods || supportedDidMethods?.includes('did:jwk')
        ? 'jwk'
        : supportedDidMethods?.includes('did:key')
          ? 'key'
          : undefined

    // If supportedDidMethods is undefined, and supportsJwk is false, we will default to did:key
    // this is important as part of MATTR launchpad support which MUST use did:key but doesn't
    // define which did methods they support
    if (!supportedDidMethods && !supportsJwk) {
      didMethod = 'key'
    }

    const shouldKeyBeHardwareBackedForMsoMdoc =
    credentialFormat === OpenId4VciCredentialFormatProfile.MsoMdoc 

    const shouldKeyBeHardwareBackedForSdJwtVc =
      (credentialFormat.toString() === 'vc+sd-jwt' || credentialFormat.toString() === 'dc+sd-jwt')

    const shouldKeyBeHardwareBacked = shouldKeyBeHardwareBackedForSdJwtVc || shouldKeyBeHardwareBackedForMsoMdoc

    const keyType = keyTypes[0]
   

    // TODO: fix Secure element key generation
    const key =  await agentContext.wallet.createKey({
      keyType,
      keyBackend: KeyBackend.Software,
    })

    if (didMethod) {
      const dm = didMethod
      const didsApi = agentContext.dependencyManager.resolve(DidsApi)
     
      const didResult = await didsApi.create<JwkDidCreateOptions | KeyDidCreateOptions>({
        method: dm,
        options: {
          key,
        },
      })

      if (didResult.didState.state !== 'finished') {
        throw new Error('DID creation failed.')
      }

      let verificationMethodId: string
      if (didMethod === 'jwk') {
        const didJwk = DidJwk.fromDid(didResult.didState.did)
        verificationMethodId = didJwk.verificationMethodId
      } else {
        const didKey = DidKey.fromDid(didResult.didState.did)
        verificationMethodId = `${didKey.did}#${didKey.key.fingerprint}`
      }

      return {
        didUrl: verificationMethodId,
        method: 'did',
        //key,
      } as const
    }

    // Otherwise we also support plain jwk for sd-jwt only
    if (
      supportsJwk &&
      (credentialFormat === OpenId4VciCredentialFormatProfile.SdJwtVc ||
        credentialFormat === OpenId4VciCredentialFormatProfile.MsoMdoc)
    ) {
      return {
        method: 'jwk',
        jwk: getJwkFromKey(key),
      }
    }

    throw new Error(
      `No supported binding method could be found. Supported methods are did:key and did:jwk, or plain jwk for sd-jwt/mdoc. Issuer supports ${
        supportsJwk ? 'jwk, ' : ''
      }${supportedDidMethods?.join(', ') ?? 'Unknown'}`
    )
  }
}
