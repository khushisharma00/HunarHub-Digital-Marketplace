const fs = require('fs');
const path = require('path');

const markdownPath = path.resolve(__dirname, 'project_report.md');
const outputPath = path.resolve(__dirname, 'project_report.html');

const markdownContent = fs.readFileSync(markdownPath, 'utf8');

// Simple Markdown to HTML converter for document presentation
function convertMarkdownToHtml(md) {
  let html = md
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-4 text-slate-900 border-b pb-2">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-3 text-slate-800">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-2 text-slate-800">$1</h3>')
    .replace(/^\*\* (.*$) \*\*/gim, '<p class="font-bold my-1 text-slate-700">$1</p>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code class="bg-slate-100 text-red-600 px-1 py-0.5 rounded text-xs">$1</code>')
    .replace(/^\s*-\s+(.*$)/gim, '<li class="ml-6 list-disc text-sm text-slate-700 my-1">$1</li>')
    .replace(/\n\n/gim, '</p><p class="text-sm leading-relaxed text-slate-700 my-3">')
    .replace(/---/gim, '<hr class="my-6 border-slate-200" />');

  return `<p class="text-sm leading-relaxed text-slate-700 my-3">${html}</p>`;
}

const styledHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HunarHub Project Report - Khushi Sharma</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { font-size: 11pt; }
      .no-print { display: none; }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 py-10 px-4">
  <div class="max-w-4xl mx-auto bg-white p-12 rounded-2xl shadow-sm border border-slate-200">
    <div class="no-print mb-6 flex justify-between items-center bg-orange-50 p-4 rounded-xl border border-orange-200">
      <div>
        <p class="font-bold text-orange-900 text-sm">HunarHub Academic Project Report</p>
        <p class="text-xs text-orange-700">Use browser Print (Cmd+P) -> "Save as PDF" to generate your submission PDF.</p>
      </div>
      <button onclick="window.print()" class="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold shadow hover:bg-orange-700">
        Print / Save to PDF
      </button>
    </div>
    ${convertMarkdownToHtml(markdownContent)}
  </div>
</body>
</html>`;

fs.writeFileSync(outputPath, styledHtml, 'utf8');
console.log('✅ Generated project_report.html successfully at docs/project_report.html');
