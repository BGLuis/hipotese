from pathlib import Path
import re
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether

ROOT = Path(__file__).resolve().parents[1]


def export():
    regular = Path('C:/Windows/Fonts/arial.ttf')
    bold = Path('C:/Windows/Fonts/arialbd.ttf')
    face, strong = 'Helvetica', 'Helvetica-Bold'
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont('ArialLab', str(regular)))
        pdfmetrics.registerFont(TTFont('ArialLabBold', str(bold)))
        face, strong = 'ArialLab', 'ArialLabBold'
        pdfmetrics.registerFontFamily('ArialLab',normal=face,bold=strong,italic=face,boldItalic=strong)
    base = ParagraphStyle('Body',fontName=face,fontSize=10.2,leading=13,
                          textColor=colors.HexColor('#243044'),spaceAfter=5,alignment=TA_LEFT)
    title = ParagraphStyle('Title',parent=base,fontName=strong,fontSize=23,leading=28,spaceAfter=12)
    heading = ParagraphStyle('Heading',parent=base,fontName=strong,fontSize=12.5,leading=17,
                             textColor=colors.HexColor('#243857'),spaceBefore=10,spaceAfter=5,keepWithNext=True)
    small = ParagraphStyle('Small',parent=base,fontSize=9,leading=12,textColor=colors.HexColor('#596779'))
    story=[]
    def inline(text):
        text = escape(text)
        text = re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+)\)',r'<link href="\2" color="#245a91">\1</link>',text)
        text = re.sub(r'\*\*([^*]+)\*\*',r'<b>\1</b>',text)
        return text.replace('`','')
    references = False
    for block in (ROOT/'docs/cenario_metodologia.md').read_text(encoding='utf-8').split('\n\n'):
        if block.startswith('# '):
            story += [Paragraph('LAB04 / SPRINT 01',small),Spacer(1,0.2*cm),Paragraph(inline(block[2:]),title),
                      Paragraph('Coleta de PRs e definição do cenário de pesquisa',base),
                      Paragraph('30 PRs com revisão Copilot e 30 sem revisão automatizada identificada. '
                                'Projeto: microsoft/vscode. Recorte: setembro de 2025. Coleta: 02/11/2026.',small),
                      Spacer(1,0.25*cm)]
        elif block.startswith('## '):
            references = block[3:].strip() == 'Referências'
            story.append(Paragraph(inline(block[3:]),heading))
        elif block.startswith('- '):
            if references:
                story.append(Paragraph('<br/>'.join(inline(line[2:]) for line in block.splitlines() if line.startswith('- ')),small))
                continue
            for line in block.splitlines():
                if line.startswith('- '):
                    story.append(Paragraph(inline(line[2:]),base,bulletText='•'))
        elif block.strip():
            story.append(Paragraph(inline(block.replace('\n',' ')),base))
    output=ROOT/'docs/cenario_pesquisa.pdf'
    def decorate(canvas, doc):
        canvas.saveState()
        width,height=doc.pagesize
        canvas.setStrokeColor(colors.HexColor('#CDD5E0'))
        canvas.line(1.8*cm,1.5*cm,width-1.8*cm,1.5*cm)
        canvas.setFont(face,8)
        canvas.setFillColor(colors.HexColor('#596779'))
        canvas.drawString(1.8*cm,1.05*cm,'LAB04 · Coleta e cenário · microsoft/vscode')
        canvas.drawRightString(width-1.8*cm,1.05*cm,str(doc.page))
        canvas.restoreState()
    doc=SimpleDocTemplate(str(output),pagesize=(21*cm,29.7*cm),leftMargin=1.9*cm,rightMargin=1.9*cm,
                          topMargin=1.65*cm,bottomMargin=2.05*cm,title='LAB04 - Cenário e metodologia',author='Equipe LAB04')
    doc.build(story,onFirstPage=decorate,onLaterPages=decorate)
    print(output)


if __name__=='__main__':
    export()
