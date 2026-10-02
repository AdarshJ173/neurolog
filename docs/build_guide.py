from pathlib import Path
from xml.sax.saxutils import escape
import re
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4

root = Path(__file__).resolve().parents[1]
source = (root/'docs/USER_GUIDE.md').read_text(encoding='utf-8')
styles = getSampleStyleSheet()
styles['Normal'].fontName='Helvetica'
styles['Normal'].fontSize=10
styles['Normal'].leading=15
styles['Normal'].spaceAfter=9
styles['Title'].textColor=colors.HexColor('#173a6a')
styles['Title'].fontSize=25
styles['Title'].leading=30
styles['Title'].spaceAfter=20
styles['Heading1'].fontSize=17
styles['Heading1'].leading=22
styles['Heading1'].textColor=colors.HexColor('#173a6a')
styles['Heading1'].spaceBefore=18
styles['Heading1'].spaceAfter=12
styles['Heading1'].keepWithNext=True
code=ParagraphStyle('Code',fontName='Courier',fontSize=9,leading=12,backColor=colors.HexColor('#edf2f8'),borderPadding=10,spaceBefore=8,spaceAfter=14)

def inline(text):
    text=escape(text)
    text=re.sub(r'\*\*(.*?)\*\*',r'<b>\1</b>',text)
    text=re.sub(r'`([^`]+)`',r'<font name="Courier">\1</font>',text)
    return text

story=[]
lines=source.splitlines(); i=0
while i<len(lines):
    line=lines[i]
    if line.startswith('```'):
        block=[];i+=1
        while i<len(lines) and not lines[i].startswith('```'):
            block.append(lines[i]);i+=1
        story.append(Preformatted('\n'.join(block),code,maxLineLength=88))
    elif line.startswith('# '):
        story.append(Paragraph(inline(line[2:]),styles['Title']))
        story.append(Paragraph('A practical guide to the repaired local application',styles['Normal']))
    elif line.startswith('## '):
        story.append(Paragraph(inline(line[3:]),styles['Heading1']))
    elif line.strip():
        if line.startswith('- '):
            story.append(Paragraph(inline(line[2:]),styles['Normal'],bulletText='-'))
        elif re.match(r'^\d+\. ',line):
            n, content=line.split('. ',1)
            story.append(Paragraph(inline(content),styles['Normal'],bulletText=n+'.'))
        else:
            paragraph=[line]
            while i+1<len(lines) and lines[i+1].strip() and not lines[i+1].startswith(('#','```','- ')):
                i+=1;paragraph.append(lines[i])
            story.append(Paragraph(inline(' '.join(paragraph)),styles['Normal']))
    i+=1

def footer(canvas,doc):
    canvas.setFont('Helvetica',8)
    canvas.setFillColor(colors.HexColor('#64748b'))
    canvas.drawString(48,30,'NeuroLog AI | Setup and user guide')
    canvas.drawRightString(A4[0]-48,30,str(doc.page))

out=root/'output/pdf/NeuroLog_User_Guide.pdf'
SimpleDocTemplate(str(out),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=45,bottomMargin=48,title='NeuroLog AI: Setup and User Guide',author='NeuroLog contributors').build(story,onFirstPage=footer,onLaterPages=footer)
from pypdf import PdfReader
reader=PdfReader(out)
print(f'Created {out} ({len(reader.pages)} pages)')
for n,page in enumerate(reader.pages,1):
    print(n,len(page.extract_text()))
