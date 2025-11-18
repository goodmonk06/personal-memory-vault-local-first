'use client'

import { useState, useEffect } from 'react'

interface MemoryItem {
  id: string
  type: 'note' | 'event' | 'link'
  title: string
  content: string
  createdAt: string
  updatedAt: string
  tags: string[]
  source: Record<string, any>
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export default function Home() {
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])

  useEffect(() => {
    fetchMemories()
  }, [])

  useEffect(() => {
    // Extract all unique tags from memories
    const tags = new Set<string>()
    memories.forEach(memory => {
      memory.tags.forEach(tag => tags.add(tag))
    })
    setAllTags(Array.from(tags).sort())
  }, [memories])

  const fetchMemories = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/items`)
      if (!response.ok) throw new Error('Failed to fetch memories')
      const data = await response.json()
      setMemories(data.items)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const searchMemories = async () => {
    if (!searchQuery && selectedTags.length === 0) {
      fetchMemories()
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','))

      const response = await fetch(`${API_URL}/query?${params}`)
      if (!response.ok) throw new Error('Failed to search memories')
      const data = await response.json()
      setMemories(data.items)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchMemories()
  }

  useEffect(() => {
    searchMemories()
  }, [selectedTags])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <>
      <header className="header">
        <div className="container">
          <h1>Memory Vault</h1>
          <p>Local-first personal memory storage with AI query capabilities</p>
        </div>
      </header>

      <div className="container">
        <div className="search-bar">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search memories... (e.g., 'typescript', 'local-first')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {allTags.length > 0 && (
            <div className="tag-filter">
              <strong>Filter by tags:</strong>
              {allTags.map(tag => (
                <span
                  key={tag}
                  className={`tag ${selectedTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="stats">
            <span>{memories.length} memories</span>
            {selectedTags.length > 0 && (
              <span>Filtered by: {selectedTags.join(', ')}</span>
            )}
          </div>
        </div>

        {error && <div className="error">Error: {error}</div>}

        {loading ? (
          <div className="loading">Loading memories...</div>
        ) : memories.length === 0 ? (
          <div className="empty-state">
            <h2>No memories found</h2>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="memory-list">
            {memories.map(memory => (
              <div key={memory.id} className="memory-card">
                <div className="memory-card-header">
                  <h3>{memory.title}</h3>
                  <span className={`memory-type ${memory.type}`}>
                    {memory.type}
                  </span>
                </div>

                <p>{memory.content}</p>

                <div className="memory-card-footer">
                  <div className="memory-tags">
                    {memory.tags.map(tag => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span>{formatDate(memory.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
