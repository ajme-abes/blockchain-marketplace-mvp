import { useEffect, useState } from 'react'
import { Box, Heading, Text, VStack } from '@chakra-ui/react'
import api from '../services/api'

function Home() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await api.get('/health')
        setHealth(response.data)
      } catch (error) {
        console.error('Health check failed:', error)
      }
    }
    
    checkHealth()
  }, [])

  return (
    <Box p={8}>
      <VStack spacing={6} align="center">
        <Heading>Blockchain-Based Marketplace</Heading>
        <Text>Connecting producers directly with buyers</Text>
        
        {health && (
          <Box p={4} borderWidth={1} borderRadius="md">
            <Text>Backend Status: {health.status}</Text>
            <Text>Message: {health.message}</Text>
          </Box>
        )}
      </VStack>
    </Box>
  )
}

export default Home