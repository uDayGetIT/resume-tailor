import { useState } from 'react'
import axios from 'axios'

const App = () => {
  const [resume, setResume] = useState('')
  const [jd, setJD] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'user',
              content: `You are an expert resume editor. Tailor the resume below to the job description.\n\nResume:\n${resume}\n\nJob Description:\n${jd}`
            }
          ],
          temperature: 0.5
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      )
      setOutput(res.data.choices[0].message.content)
    } catch (err) {
      console.error(err)
      setOutput('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>📝 Free Resume Tailor</h1>
      <textarea
        placeholder="Paste your resume here"
        rows={10}
        style={{ width: '100%', marginBottom: 10 }}
        onChange={(e) => setResume(e.target.value)}
      />
      <textarea
        placeholder="Paste job description here"
        rows={8}
        style={{ width: '100%', marginBottom: 10 }}
        onChange={(e) => setJD(e.target.value)}
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Tailoring...' : 'Tailor My Resume'}
      </button>
      {output && (
        <>
          <h2>🎯 Tailored Resume</h2>
          <textarea
            value={output}
            rows={20}
            style={{ width: '100%' }}
            readOnly
          />
        </>
      )}
    </div>
  )
}

export default App
