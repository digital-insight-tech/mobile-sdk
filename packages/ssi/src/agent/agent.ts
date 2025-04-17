import {
  Agent,
  DidsModule,
  WebDidResolver
} from '@credo-ts/core'
import {
  AnonCredsCredentialFormatService,
  AnonCredsModule,
  AnonCredsProofFormatService,
  DataIntegrityCredentialFormatService,
  LegacyIndyCredentialFormatService,
  LegacyIndyProofFormatService,
  V1CredentialProtocol,
  V1ProofProtocol,
} from '@credo-ts/anoncreds'
import { AutoAcceptCredential, AutoAcceptProof, BasicMessagesModule, ConnectionsModule, CredentialsModule, DidCommModule, DifPresentationExchangeProofFormatService, DiscoverFeaturesModule, HttpOutboundTransport, JsonLdCredentialFormatService, MediationRecipientModule, MediatorPickupStrategy, MessagePickupModule, OutOfBandModule, ProofsModule, V2CredentialProtocol, V2ProofProtocol, WsOutboundTransport } from '@credo-ts/didcomm'
import {
  IndyVdrAnonCredsRegistry,
  IndyVdrIndyDidResolver,
  IndyVdrModule,
  IndyVdrSovDidResolver,
} from '@credo-ts/indy-vdr'

import type { AgentModulesInput } from '@credo-ts/core/build/agent/AgentModules'
import { AskarModule } from '@credo-ts/askar'
import type { IndyVdrPoolConfig } from '@credo-ts/indy-vdr'
import type { InitConfig } from '@credo-ts/core'
// import { PushNotificationsFcmModule } from '@credo-ts/push-notifications'
import { QuestionAnswerModule } from '@credo-ts/question-answer'
import { agentDependencies } from '@credo-ts/react-native'
import { anoncreds } from '@hyperledger/anoncreds-react-native'
import { askar } from '@openwallet-foundation/askar-react-native'
import { indyVdr } from '@hyperledger/indy-vdr-react-native'

export type AdeyaAgentModuleOptions = {
  mediatorInvitationUrl: string
  mediatorPickupStrategy: MediatorPickupStrategy
  indyNetworks: [IndyVdrPoolConfig, ...IndyVdrPoolConfig[]]
  maximumMessagePickup?: number
}

export type AdeyaAgentModules = ReturnType<typeof getAgentModules>

export type AdeyaAgent = Agent<AdeyaAgentModules>

export const getAgentModules = ({
  mediatorInvitationUrl,
  mediatorPickupStrategy,
  indyNetworks,
  maximumMessagePickup = 5,
}: AdeyaAgentModuleOptions) => {
  return {
    askar: new AskarModule({
      askar,
    }),
    anoncreds: new AnonCredsModule({
      registries: [new IndyVdrAnonCredsRegistry()],
      anoncreds,
    }),
    mediationRecipient: new MediationRecipientModule({
      mediatorInvitationUrl,
      mediatorPickupStrategy,
      maximumMessagePickup,
    }),
    dids: new DidsModule({
      registrars: [],
      resolvers: [new WebDidResolver(), new IndyVdrSovDidResolver(), new IndyVdrIndyDidResolver()],
    }),
    indyVdr: new IndyVdrModule({
      indyVdr,
      networks: indyNetworks,
    }),
    didcomm: new DidCommModule(),
    credentials: new CredentialsModule({
      autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
      credentialProtocols: [
        new V1CredentialProtocol({
          indyCredentialFormat: new LegacyIndyCredentialFormatService(),
        }),
        new V2CredentialProtocol({
          credentialFormats: [
            new LegacyIndyCredentialFormatService(),
            new AnonCredsCredentialFormatService(),
            new DataIntegrityCredentialFormatService(),
            new JsonLdCredentialFormatService(),
          ],
        }),
      ],
    }),
    proofs: new ProofsModule({
      autoAcceptProofs: AutoAcceptProof.ContentApproved,
      proofProtocols: [
        new V1ProofProtocol({
          indyProofFormat: new LegacyIndyProofFormatService(),
        }),
        new V2ProofProtocol({
          proofFormats: [
            new LegacyIndyProofFormatService(),
            new AnonCredsProofFormatService(),
            new DifPresentationExchangeProofFormatService(),
          ],
        }),
      ],
    }),
    connections: new ConnectionsModule({
      autoAcceptConnections: true,
    }),
    basicMessages: new BasicMessagesModule(),
    outOfBand: new OutOfBandModule(),
    messagePickup: new MessagePickupModule(),
    discovery: new DiscoverFeaturesModule(),
    // pushNotificationsFcm: new PushNotificationsFcmModule(),
    questionAnswer: new QuestionAnswerModule(),
  }
}

export const initializeAgent = async ({
  agentConfig,
  modules,
}: {
  agentConfig: InitConfig
  modules: AdeyaAgentModules
}) => {
  const agent = new Agent({
    dependencies: agentDependencies,
    config: {
      autoUpdateStorageOnStartup: true,
      ...agentConfig,
    },
    modules,
  })

  agent.modules.didcomm.registerOutboundTransport(new HttpOutboundTransport())
  agent.modules.didcomm.registerOutboundTransport(new WsOutboundTransport())

  await agent.initialize()

  return agent
}
