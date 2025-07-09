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
              content: `Act as a professional resume writer. Rewrite the resume below to match the job description. Format it using modern HTML resume structure like Jake’s resume — use <section>, <h2>, <ul>, <li>, <strong>, and <p> only. Return just the formatted HTML resume body. No extra comments.\n\nResume:\n${resume}\n\nJob Description:\n${jd}`
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
    html2pdf().set({
      margin: 0.5,
      filename: 'Tailored_Resume.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }).from(element).save()
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>📝 Resume Tailor (Free & Smart)</h1>

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
              padding: '40px',
              background: '#fff',
              fontFamily: "'Inter', sans-serif",
              color: '#222',
              maxWidth: '800px',
              margin: '20px auto',
              boxShadow: '0 0 10px rgba(0,0,0,0.05)'
            }}
          >
            <style>
              {`
                #resume-output h1 {
                  font-size: 26px;
                  margin-bottom: 5px;
                }
                #resume-output h2 {
                  font-size: 18px;
                  margin-top: 24px;
                  border-bottom: 1px solid #ddd;
                  padding-bottom: 4px;
                }
                #resume-output p, li {
                  font-size: 14px;
                  line-height: 1.6;
                }
                #resume-output ul {
                  padding-left: 20px;
                }
              `}
            </style>
            <div dangerouslySetInnerHTML={{ __html: output }} />
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
