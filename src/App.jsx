import { useState } from 'react'
import axios from 'axios'
import html2pdf from 'html2pdf.js'
import ResumePreview from './ResumePreview'

// ✅ PDF extraction
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const App = () => {
  const [resume, setResume] = useState('')
  const [jd, setJD] = useState('')
  const [jsonData, setJsonData] = useState(null)
  const [loading, setLoading] = useState(false)

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

  const handleTailor = async () => {
    setLoading(true)
    try {
      const res = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'user',
              content: `You are a professional resume writer and ATS optimization expert. Given a resume and job description, tailor the resume content to match the job description as closely as possible to maximize ATS score (80%+). Highlight relevant skills, experience, and projects that align with the job. Do not include irrelevant information.

Output only a JSON object with these fields:
{
  "name": "",
  "contact": {
    "email": "",
    "phone": "",
    "linkedin": "",
    "github": ""
  },
  "summary": "",
  "skills": [],
  "experience": [
    {
      "title": "",
      "company": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "bullets": []
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "location": "",
      "startDate": "",
      "endDate": ""
    }
  ],
  "projects": [
    {
      "title": "",
      "technologies": "",
      "bullets": []
    }
  ]
}
Only return valid JSON. No explanation or formatting around it. Tailor each section to fit the job description as much as possible.`
            },
            {
              role: 'user',
              content: `Resume:\n${resume}\n\nJob Description:\n${jd}`
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

      const raw = res.data.choices[0].message.content.trim()
      const parsed = JSON.parse(raw)
      setJsonData(parsed)
    } catch (err) {
      console.error('Failed to parse JSON or fetch:', err)
      alert('Something went wrong. Check the console or try again.')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = () => {
    const element = document.getElementById('resume-preview')
    html2pdf().from(element).save('ATS-Tailored-Resume.pdf')
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>📄 ATS Resume Tailor</h1>

      <h3>Upload PDF Resume</h3>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => handlePDFUpload(e.target.files[0])}
        style={{ marginBottom: 10 }}
      />

      <textarea
        placeholder="Or paste your resume here"
        rows={8}
        style={{ width: '100%', marginBottom: 10 }}
        value={resume}
        onChange={(e) => setResume(e.target.value)}
      />

      <textarea
        placeholder="Paste job description here"
        rows={8}
        style={{ width: '100%', marginBottom: 10 }}
        value={jd}
        onChange={(e) => setJD(e.target.value)}
      />

      <button onClick={handleTailor} disabled={loading}>
        {loading ? 'Tailoring…' : 'Tailor Resume'}
      </button>

      {jsonData && (
        <>
          <ResumePreview data={jsonData} />
          <button onClick={downloadPDF} style={{ marginTop: 12 }}>
            ⬇️ Download PDF
          </button>
        </>
      )}
    </div>
  )
}

export default App
