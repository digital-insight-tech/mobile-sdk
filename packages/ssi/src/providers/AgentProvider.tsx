import AgentProvider, { useAgent } from '@credo-ts/react-hooks'
import { AdeyaAgent } from '../agent'

const useAdeyaAgent:() => {
  loading: boolean
  agent: AdeyaAgent
} = useAgent

export { useAdeyaAgent, AgentProvider as AdeyaAgentProvider }
