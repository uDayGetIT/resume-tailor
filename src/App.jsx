import { useState } from 'react'
import axios from 'axios'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry'
import html2pdf from 'html2pdf.js'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

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
              content: `You are an expert resume editor. Tailor the resume below to match the job description. Improve tone, ATS formatting, and clarity.\n\nResume:\n${resume}\n\nJob Description:\n${jd}`
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

  const handlePDFUpload = async (file) => {
    const reader = new FileReader()
    reader.onload = async function () {
      const typedarray = new Uint8Array(this.result)
      const pdf = await pdfjsLib.getDocument(typedarray).promise
      let text = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map((s) => s.str).join(' ') + '\n'
      }
      setResume(text)
    }
    reader.readAsArrayBuffer(file)
  }

  const downloadPDF = () => {
    const element = document.getElementById('resume-output')
    html2pdf().from(element).save('Tailored_Resume.pdf')
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>📝 Free Resume Tailor</h1>

      <h3>1. Upload PDF Resume or Paste Below</h3>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => handlePDFUpload(e.target.files[0])}
        style={{ marginBottom: 10 }}
      />
      <textarea
        placeholder="Or paste your resume here"
        rows={10}
        style={{ width: '100%', marginBottom: 10 }}
        onChange={(e) => setResume(e.target.value)}
        value={resume}
      />

      <h3>2. Paste Job Description</h3>
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
          <div
            id="resume-output"
            style={{
              border: '1px solid #ccc',
              padding: '20px',
              marginTop: '10px',
              fontFamily: 'Georgia, serif',
              backgroundColor: '#fff'
            }}
          >
            <pre style={{ whiteSpace: 'pre-wrap' }}>{output}</pre>
          </div>
          <button onClick={downloadPDF} style={{ marginTop: '10px' }}>
            ⬇️ Download as PDF
          </button>
        </>
      )}
    </div>
  )
}

export default App
