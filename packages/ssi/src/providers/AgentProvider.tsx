import AgentProvider, { useAgent } from '@credo-ts/react-hooks'
import { AdeyaAgent } from '../agent'
import { AgentModulesInput } from '@credo-ts/core/build/agent/AgentModules'
import { Agent } from '@credo-ts/core'

const useAdeyaAgent: <AgentModules extends AgentModulesInput = AgentModulesInput>() => {
  loading: boolean
  agent: Agent<AgentModules>
} = useAgent

export { useAdeyaAgent, AgentProvider as AdeyaAgentProvider }